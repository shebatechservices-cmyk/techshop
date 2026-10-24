const pool = require('../../config/db');
const { hashPassword, verifyPassword, isPasswordHash, createSessionToken } = require('../../config/auth');
const { hashSessionToken } = require('../../middlewares/authMiddleware');
const { ensureSecurityTables } = require('./securitySchema');
const { isIpLocked, recordFailedAttempt, resetIpAttempts } = require('./ipLockoutService');
const { createDeviceVerification } = require('./twoFactorController');
const { signup } = require('./signupController');

exports.signup = signup;

exports.login = async (req, res) => {
    try {
        await ensureSecurityTables();
        const headers = req.headers || {};
        const clientIp = headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || req.ip || '127.0.0.1';

        // 1. IP Lockout Check
        const ipLockStatus = isIpLocked(clientIp);
        if (ipLockStatus.isLocked) {
            return res.status(429).json({
                success: false,
                message: `Too many failed login attempts from your IP address. For security, access has been locked for ${ipLockStatus.remainingMinutes} more minute(s).`
            });
        }

        const { email, phone, username, password, device_id, device_name, device_type, browser_info } = req.body;
        const rawIdentifier = (email || phone || username || '').trim();
        const pass = (password || '').trim();

        if (!rawIdentifier || !pass) {
            return res.status(400).json({ success: false, message: 'Please enter your phone number or email and password.' });
        }

        const cleanEmail = rawIdentifier.toLowerCase();
        const digitsOnly = rawIdentifier.replace(/[^0-9]/g, '');
        let cleanPhone = rawIdentifier;
        if (digitsOnly.length === 11 && digitsOnly.startsWith('01')) {
            cleanPhone = digitsOnly;
        } else if (digitsOnly.length === 13 && digitsOnly.startsWith('8801')) {
            cleanPhone = '0' + digitsOnly.slice(3);
        }

        // 2. User Lookup
        const userQuery = `
            SELECT u.*, COALESCE(r.name, u.role_name, 'Staff') as role_title
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE (LOWER(u.email) = $1 OR u.phone = $1 OR u.phone = $2) AND u.deleted_at IS NULL
            ORDER BY u.id ASC LIMIT 1;
        `;
        const result = await pool.query(userQuery, [cleanEmail, cleanPhone]);

        if (result.rows.length === 0) {
            recordFailedAttempt(clientIp);
            return res.status(401).json({ success: false, message: 'User not found! Please check your mobile or email.' });
        }

        const user = result.rows[0];
        const isSuperAdmin = user.role_id === 1;

        if (user.approval_status === 'pending_approval') {
            return res.status(403).json({ success: false, message: 'Your staff account is pending approval by the shop administrator.' });
        }
        if (!user.is_active) {
            return res.status(403).json({ success: false, message: 'This account has been deactivated. Please contact your administrator.' });
        }
        if (user.is_locked && !isSuperAdmin) {
            return res.status(403).json({ success: false, message: 'Account locked due to excessive failed attempts. Contact administrator.' });
        }

        // 3. Password Verification
        const isMatch = await verifyPassword(pass, user.password_hash);
        if (!isMatch) {
            const ipLock = recordFailedAttempt(clientIp);
            const newFailCount = (user.failed_login_count || 0) + 1;
            const shouldLock = newFailCount >= 5 && !isSuperAdmin;
            await pool.query('UPDATE users SET failed_login_count = $1, is_locked = $2 WHERE id = $3', [newFailCount, shouldLock, user.id]);

            if (ipLock.isLocked) {
                return res.status(429).json({
                    success: false,
                    message: `Account and IP locked out due to 5 consecutive failed attempts. Please wait ${ipLock.remainingMinutes} minutes.`
                });
            }

            return res.status(401).json({
                success: false,
                message: shouldLock
                    ? 'Account locked due to 5 consecutive failed password attempts.'
                    : `Incorrect password! (Attempts: ${newFailCount}/5)`
            });
        }

        // Password matches -> Clear IP failed attempts
        resetIpAttempts(clientIp);

        // 4. Device Identification & 2FA Check
        const userAgent = headers['user-agent'] || '';
        const devId = (device_id || `DEV-${user.id}-${clientIp.replace(/[^a-zA-Z0-9]/g, '')}`).substring(0, 99);
        const devName = (device_name || (userAgent ? userAgent.substring(0, 100) : 'Browser Device')).substring(0, 149);
        const devType = device_type || (/mobile|android|iphone|ipad/i.test(userAgent) ? 'mobile' : 'desktop');
        const bInfo = (browser_info || userAgent || 'Web Browser').substring(0, 250);

        // Check if device is already authorized
        const devCheck = await pool.query(
            'SELECT id, is_authorized, approval_status FROM trusted_devices WHERE device_id = $1 AND user_id = $2',
            [devId, user.id]
        );
        const isDeviceAuthorized = devCheck.rows.length > 0 && devCheck.rows[0].is_authorized;

        // If NOT an authorized device and not localhost dev bypass, require 2FA
        if (!isDeviceAuthorized) {
            const verifData = await createDeviceVerification({ user, devId, devName, devType, bInfo, clientIp });
            return res.status(200).json({
                success: true,
                requires_2fa: true,
                message: 'New device detected! A 6-digit verification code has been sent to your email, or your Shop Admin can authorize this device from SOC Security.',
                ...verifData,
            });
        }

        // 5. Authorized Device -> Issue Session Token
        const token = createSessionToken();
        const tokenHash = hashSessionToken(token);
        const passwordHash = isPasswordHash(user.password_hash) ? user.password_hash : await hashPassword(pass);

        await pool.query(`
            UPDATE users
            SET last_login = NOW(), failed_login_count = 0, is_locked = false,
                password_hash = $1, current_session_token = $2, session_last_active = NOW()
            WHERE id = $3
        `, [passwordHash, tokenHash, user.id]);

        await pool.query(`
            UPDATE trusted_devices
            SET last_active = NOW(), is_authorized = true, approval_status = 'APPROVED', ip_address = $1, browser_info = $2
            WHERE device_id = $3 AND user_id = $4
        `, [clientIp, bInfo, devId, user.id]);

        await pool.query(`
            INSERT INTO audit_logs (user_id, action, table_name, record_id, ip_address, severity)
            VALUES ($1, 'LOGIN_SUCCESS', 'users', $1, $2, 'INFO')
        `, [user.id, clientIp]).catch(() => null);

        return res.status(200).json({
            success: true,
            message: 'Login successful!',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role || 'STAFF',
                role_id: user.role_id || 1,
                role_name: user.role_title || user.role_name || 'Staff',
                designation: user.designation || '',
                wallet_balance: parseFloat(user.wallet_balance || 0),
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

exports.logout = async (req, res) => {
    try {
        const token = req.headers['authorization']?.replace('Bearer ', '') || req.headers['x-session-token'] || req.body?.token;
        if (token) {
            await pool.query('UPDATE users SET current_session_token = NULL WHERE current_session_token = $1', [hashSessionToken(token)]);
        }
        return res.status(200).json({ success: true, message: 'Logged out successfully.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.verifySession = async (req, res) => res.status(200).json({ active: true, user: req.user });
exports.getCurrentUser = async (req, res) => res.status(200).json({ success: true, active: true });
