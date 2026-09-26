const pool = require('../../config/db');
const { hashPassword, verifyPassword, isPasswordHash, createSessionToken } = require('../../config/auth');
const { hashSessionToken } = require('../../middlewares/authMiddleware');
const { ensureSecurityTables } = require('./securitySchema');

// User Authentication / Login (Standard Multi-device & Multi-tab Authentication)
exports.login = async (req, res) => {
    try {
        await ensureSecurityTables();
        const { email, phone, username, password, device_id, device_name, device_type, browser_info } = req.body;
        const rawIdentifier = (email || phone || username || '').trim();
        const pass = (password || '').trim();

        if (!rawIdentifier || !pass) {
            return res.status(400).json({
                success: false,
                message: 'Please enter your phone number or email and password.'
            });
        }

        const lowerId = rawIdentifier.toLowerCase();
        const cleanEmail = lowerId;
        const digitsOnly = rawIdentifier.replace(/[^0-9]/g, '');
        let cleanPhone = rawIdentifier;
        if (digitsOnly.length === 11 && digitsOnly.startsWith('01')) {
            cleanPhone = digitsOnly;
        } else if (digitsOnly.length === 13 && digitsOnly.startsWith('8801')) {
            cleanPhone = '0' + digitsOnly.slice(3);
        }

        // Dynamic Database User Lookup by Phone or Email
        const userQuery = `
            SELECT u.*, COALESCE(r.name, u.role_name, 'Staff') as role_title
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE (
                LOWER(u.email) = $1
                OR u.phone = $1
                OR u.phone = $2
            )
            AND u.deleted_at IS NULL
            ORDER BY u.id ASC
            LIMIT 1;
        `;
        const result = await pool.query(userQuery, [cleanEmail, cleanPhone]);

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'User not found! Please check your mobile number or email address.'
            });
        }

        const user = result.rows[0];
        const isSuperAdmin = user.role_id === 1;

        // Check Admin Approval Status for Staff
        if (user.approval_status === 'pending_approval') {
            return res.status(403).json({
                success: false,
                message: 'Your staff/technician registration is pending approval by the shop administrator. You will be able to log in once approved.'
            });
        }

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'This account has been deactivated. Please contact your administrator.'
            });
        }

        // Super Admin is never locked out
        if (user.is_locked && !isSuperAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Account temporarily locked due to excessive failed attempts. Please contact your administrator.'
            });
        }

        const isMatch = await verifyPassword(pass, user.password_hash);

        if (!isMatch) {
            const newFailCount = (user.failed_login_count || 0) + 1;
            const shouldLock = newFailCount >= 5 && !isSuperAdmin;
            await pool.query(
                'UPDATE users SET failed_login_count = $1, is_locked = $2 WHERE id = $3',
                [newFailCount, shouldLock, user.id]
            );

            return res.status(401).json({
                success: false,
                message: shouldLock
                    ? 'Account locked due to 5 consecutive failed password attempts.'
                    : `Incorrect password! Please enter the correct password. (Attempts: ${newFailCount}/5)`
            });
        }

        const token = createSessionToken();
        const tokenHash = hashSessionToken(token);
        const passwordHash = isPasswordHash(user.password_hash) ? user.password_hash : await hashPassword(pass);

        // Successful Login & Session Update (store the token hashed)
        await pool.query(`
            UPDATE users
            SET last_login = NOW(), failed_login_count = 0, is_locked = false,
                password_hash = $1, current_session_token = $2, session_last_active = NOW()
            WHERE id = $3
        `, [passwordHash, tokenHash, user.id]);

        // Standard Device Session Tracking in trusted_devices
        const headers = req.headers || {};
        const clientIp = headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || req.ip || '127.0.0.1';
        const userAgent = headers['user-agent'] || '';
        const devId = (device_id || `DEV-${user.id}-${clientIp.replace(/[^a-zA-Z0-9]/g, '')}`).substring(0, 99);
        const devName = (device_name || (userAgent ? userAgent.substring(0, 100) : 'Browser Device')).substring(0, 149);
        const devType = device_type || (/mobile|android|iphone|ipad/i.test(userAgent) ? 'mobile' : 'desktop');
        const bInfo = (browser_info || userAgent || 'Web Browser').substring(0, 250);

        try {
            await pool.query(`
                INSERT INTO trusted_devices (device_id, device_name, user_id, device_type, browser_info, ip_address, is_authorized, last_active)
                VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
                ON CONFLICT (device_id) DO UPDATE
                SET last_active = NOW(), is_authorized = true, ip_address = $6, browser_info = $5;
            `, [devId, devName, user.id, devType, bInfo, clientIp]);
        } catch (devErr) {
            console.warn('Device tracking notice:', devErr.message);
        }

        // Record in Audit Log
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
                role: user.role || ((user.role_title || user.role_name || '').toLowerCase().includes('admin') || user.role_id === 1 ? 'ADMIN' : (user.role_title || user.role_name || '').toLowerCase().includes('tech') || user.role_id === 4 ? 'TECHNICIAN' : 'STAFF'),
                role_id: user.role_id || 1,
                role_name: user.role_title || user.role_name || 'Super Admin',
                designation: user.designation || '',
                wallet_balance: parseFloat(user.wallet_balance || 0)
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

// Sign Up (Online User Auto-approved vs Staff/Technician Admin-confirmed)
exports.signup = async (req, res) => {
    try {
        await ensureSecurityTables();
        const { name, identifier, password, user_type = 'online', staff_role = 'Field Technician' } = req.body;
        const cleanName = (name || '').trim();
        const rawId = (identifier || '').trim();
        const pass = (password || '').trim();

        if (!cleanName || !rawId || !pass) {
            return res.status(400).json({
                success: false,
                message: 'Full name, phone/email, and password are required.'
            });
        }

        const cleanEmail = rawId.toLowerCase();
        const digitsOnly = rawId.replace(/[^0-9]/g, '');
        let cleanPhone = rawId;
        let isPhone = false;
        if (digitsOnly.length === 11 && digitsOnly.startsWith('01')) {
            cleanPhone = digitsOnly;
            isPhone = true;
        } else if (digitsOnly.length === 13 && digitsOnly.startsWith('8801')) {
            cleanPhone = '0' + digitsOnly.slice(3);
            isPhone = true;
        }

        // Check duplicate account
        const dupCheck = await pool.query(`
            SELECT id FROM users
            WHERE (LOWER(email) = $1 OR phone = $2 OR phone = $3) AND deleted_at IS NULL
        `, [cleanEmail, cleanPhone, rawId]);

        if (dupCheck.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'An account already exists with this phone number or email!'
            });
        }

        const isOnline = (user_type === 'online');
        const roleName = isOnline ? 'Customer / Online User' : (staff_role || 'Field Technician');
        const roleId = isOnline ? 5 : 4;
        const approvalStatus = isOnline ? 'approved' : 'pending_approval';
        const isActive = isOnline; // Online users are active immediately, staff must be confirmed by admin

        const insRes = await pool.query(`
            INSERT INTO users (name, phone, email, password_hash, role_id, role_name, is_active, approval_status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            RETURNING id, name, phone, email, role_id, role_name, is_active, approval_status, created_at;
        `, [
            cleanName,
            isPhone ? cleanPhone : (rawId.includes('@') ? '' : rawId),
            rawId.includes('@') ? cleanEmail : null,
            await hashPassword(pass),
            roleId,
            roleName,
            isActive,
            approvalStatus
        ]);

        const newUser = insRes.rows[0];

        if (isOnline) {
            const token = createSessionToken();
            await pool.query('UPDATE users SET current_session_token = $1, session_last_active = NOW() WHERE id = $2', [hashSessionToken(token), newUser.id]);
            return res.status(201).json({
                success: true,
                auto_login: true,
                message: 'Registration as online user was successful!',
                token,
                user: {
                    id: newUser.id,
                    name: newUser.name,
                    email: newUser.email,
                    phone: newUser.phone,
                    role_id: newUser.role_id,
                    role_name: newUser.role_name
                }
            });
        } else {
            return res.status(201).json({
                success: true,
                auto_login: false,
                message: 'Staff/technician registration submitted! You will be able to log in once approved by the shop administrator.',
                user: newUser
            });
        }
    } catch (err) {
        console.error('Signup error:', err);
        return res.status(500).json({ success: false, message: 'Registration error: ' + err.message });
    }
};

// Logout & Release Session Token
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

// Verify Session Heartbeat
exports.verifySession = async (req, res) => {
    try {
        return res.status(200).json({ active: true, user: req.user });
    } catch (err) {
        return res.status(500).json({ active: false, error: err.message });
    }
};

// Get Current User Session
exports.getCurrentUser = async (req, res) => {
    return res.status(200).json({ success: true, active: true });
};
