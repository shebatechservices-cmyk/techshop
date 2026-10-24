const crypto = require('crypto');
const pool = require('../../config/db');
const { ensureTwoFactorTables } = require('./twoFactorSchema');
const { sendTwoFactorCodeEmail } = require('../../services/emailService');
const { maskEmail, completeVerifiedSession } = require('./twoFactorHelpers');

function hashOtp(code) {
    return crypto.createHash('sha256').update(String(code).trim()).digest('hex');
}

/**
 * Creates a pending device verification record and dispatches email OTP.
 */
async function createDeviceVerification({ user, devId, devName, devType, bInfo, clientIp }) {
    await ensureTwoFactorTables();

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = hashOtp(code);
    const verificationToken = 'verif_' + crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 1. Record verification request
    await pool.query(`
        INSERT INTO device_verification_codes (user_id, device_id, device_name, verification_token, code_hash, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6)
    `, [user.id, devId, devName, verificationToken, codeHash, expiresAt]);

    // 2. Register device as PENDING in trusted_devices
    await pool.query(`
        INSERT INTO trusted_devices (device_id, device_name, user_id, device_type, browser_info, ip_address, is_authorized, approval_status, last_active)
        VALUES ($1, $2, $3, $4, $5, $6, false, 'PENDING_APPROVAL', NOW())
        ON CONFLICT (device_id) DO UPDATE
        SET user_id = $3, device_name = $2, ip_address = $6, browser_info = $5, last_active = NOW(),
            is_authorized = false, approval_status = 'PENDING_APPROVAL'
    `, [devId, devName, user.id, devType, bInfo, clientIp]);

    // 3. Log Audit Alert for Admin
    await pool.query(`
        INSERT INTO audit_logs (user_id, action, table_name, record_id, ip_address, severity)
        VALUES ($1, 'NEW_DEVICE_PENDING_APPROVAL', 'trusted_devices', $1, $2, 'WARNING')
    `, [user.id, clientIp]).catch(() => null);

    // 4. Dispatch Email OTP
    const emailResult = await sendTwoFactorCodeEmail({
        to: user.email,
        userName: user.name,
        code,
        deviceName: devName,
        ipAddress: clientIp,
    });

    const isSimulated = Boolean(!emailResult || emailResult.simulated || !emailResult.success);

    return {
        verification_token: verificationToken,
        device_id: devId,
        masked_email: maskEmail(user.email),
        simulated: isSimulated,
        ...(isSimulated ? { simulated_code: code } : {}),
    };
}

/**
 * Verifies OTP code submitted by user.
 */
async function verifyDeviceOtp(req, res) {
    try {
        await ensureTwoFactorTables();
        const { verification_token, device_id, code } = req.body;

        if (!verification_token || !device_id) {
            return res.status(400).json({ success: false, message: 'Verification token and device ID are required.' });
        }

        const vRes = await pool.query(`
            SELECT v.*, u.id as user_id, u.name, u.email, u.phone, u.role_id, u.is_active, u.is_locked,
                   r.name as role_name, r.title as role_title, td.is_authorized as admin_approved
            FROM device_verification_codes v
            JOIN users u ON v.user_id = u.id
            LEFT JOIN roles r ON u.role_id = r.id
            LEFT JOIN trusted_devices td ON td.device_id = v.device_id AND td.user_id = u.id
            WHERE v.verification_token = $1 AND v.device_id = $2
            ORDER BY v.id DESC LIMIT 1
        `, [verification_token, device_id]);

        if (vRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Invalid or expired verification session.' });
        }

        const record = vRes.rows[0];

        // Path 1 Check: Has Admin already approved this device directly?
        if (record.admin_approved) {
            await pool.query('UPDATE device_verification_codes SET is_used = true WHERE id = $1', [record.id]);
            const session = await completeVerifiedSession(record, device_id);
            return res.status(200).json({ success: true, message: 'Device authorized by Admin! Login successful.', ...session });
        }

        if (record.is_used) {
            return res.status(400).json({ success: false, message: 'This verification code has already been used.' });
        }

        if (new Date() > new Date(record.expires_at)) {
            return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new code.' });
        }

        // Path 2 Check: User submitted 6-digit OTP code
        if (!code) {
            return res.status(400).json({ success: false, message: 'Please enter the 6-digit verification code.' });
        }

        if (hashOtp(code) !== record.code_hash) {
            await pool.query('UPDATE device_verification_codes SET attempts = attempts + 1 WHERE id = $1', [record.id]);
            return res.status(400).json({ success: false, message: 'Incorrect verification code. Please check your email and try again.' });
        }

        // Valid OTP -> Authorize device & log in
        await pool.query('UPDATE device_verification_codes SET is_used = true WHERE id = $1', [record.id]);
        const session = await completeVerifiedSession(record, device_id);

        return res.status(200).json({
            success: true,
            message: 'Device verified and authorized successfully! Login complete.',
            ...session,
        });
    } catch (err) {
        console.error('verifyDeviceOtp error:', err);
        return res.status(500).json({ success: false, message: 'Verification failed: ' + err.message });
    }
}

/**
 * Polled by login screen to check if Admin authorized the device from SOC Security dashboard.
 */
async function checkDeviceApproval(req, res) {
    try {
        await ensureTwoFactorTables();
        const { verification_token, device_id } = req.query;

        if (!verification_token || !device_id) {
            return res.status(400).json({ success: false, message: 'Token and device ID required.' });
        }

        const vRes = await pool.query(`
            SELECT v.id, td.is_authorized, u.id as user_id, u.name, u.email, u.phone, u.role_id,
                   r.name as role_name, r.title as role_title
            FROM device_verification_codes v
            JOIN users u ON v.user_id = u.id
            LEFT JOIN roles r ON u.role_id = r.id
            JOIN trusted_devices td ON td.device_id = v.device_id AND td.user_id = u.id
            WHERE v.verification_token = $1 AND v.device_id = $2
            ORDER BY v.id DESC LIMIT 1
        `, [verification_token, device_id]);

        if (vRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Session not found.' });
        }

        const record = vRes.rows[0];
        if (record.is_authorized) {
            await pool.query('UPDATE device_verification_codes SET is_used = true WHERE id = $1', [record.id]);
            const session = await completeVerifiedSession(record, device_id);
            return res.status(200).json({ success: true, approved: true, message: 'Device approved by Admin!', ...session });
        }

        return res.status(200).json({ success: true, approved: false, message: 'Waiting for Admin authorization or 2FA code.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = {
    createDeviceVerification,
    verifyDeviceOtp,
    checkDeviceApproval,
};
