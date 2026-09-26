const pool = require('../../config/db');
const { hashPassword } = require('../../config/auth');
const { ensureSecurityTables } = require('./securitySchema');

// Submit Forgot ID / Password Recovery Request (Staff -> Admin OR Admin -> Developer)
exports.submitRecoveryRequest = async (req, res) => {
    try {
        await ensureSecurityTables();
        const { identifier, user_type = 'staff', shop_name = '', contact_phone = '', reason = '' } = req.body;
        const cleanId = (identifier || '').trim();

        if (!cleanId) {
            return res.status(400).json({
                success: false,
                message: 'Please enter your registered mobile number or email.'
            });
        }

        const digits = cleanId.replace(/[^0-9]/g, '');
        let cleanPhone = cleanId;
        if (digits.length === 11 && digits.startsWith('01')) cleanPhone = digits;
        else if (digits.length === 13 && digits.startsWith('8801')) cleanPhone = '0' + digits.slice(3);

        // Find user by identifier
        const uRes = await pool.query(`
            SELECT id, name, email, phone, role_id, role_name
            FROM users
            WHERE (LOWER(email) = $1 OR phone = $1 OR phone = $2) AND deleted_at IS NULL
            LIMIT 1;
        `, [cleanId.toLowerCase(), cleanPhone]);

        const user = uRes.rows[0];
        const isAdmin = user ? (user.role_id === 1 || String(user_type).toLowerCase() === 'admin') : (String(user_type).toLowerCase() === 'admin');
        const targetRole = isAdmin ? 'developer' : 'admin';

        const insRes = await pool.query(`
            INSERT INTO password_reset_requests
            (user_id, user_name, identifier, user_type, target_role, contact_phone, shop_name, reason, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
            RETURNING *;
        `, [
            user ? user.id : null,
            user ? user.name : (shop_name || 'App User'),
            cleanId,
            isAdmin ? 'admin' : 'staff',
            targetRole,
            contact_phone || (user ? user.phone : cleanPhone),
            shop_name || 'Sheba Technology & Networking',
            reason || 'Forgot password recovery requested.'
        ]);

        return res.status(201).json({
            success: true,
            message: isAdmin
                ? 'Admin password recovery request sent to developer successfully. The developer will review and reset your password.'
                : 'Staff password recovery request sent to shop administrator successfully. The administrator will reset your password from the control panel.',
            target_role: targetRole,
            data: insRes.rows[0]
        });
    } catch (err) {
        console.error('submitRecoveryRequest error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Get Staff Recovery Requests (For App Admin)
exports.getStaffRecoveryRequests = async (req, res) => {
    try {
        await ensureSecurityTables();
        const result = await pool.query(`
            SELECT pr.*, u.role_name as user_role, u.is_active
            FROM password_reset_requests pr
            LEFT JOIN users u ON pr.user_id = u.id
            WHERE pr.target_role = 'admin'
            ORDER BY (pr.status = 'pending') DESC, pr.id DESC
            LIMIT 50;
        `);
        return res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        console.error('getStaffRecoveryRequests error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Resolve Staff Recovery (App Admin sets new password)
exports.resolveStaffRecovery = async (req, res) => {
    try {
        await ensureSecurityTables();
        const { requestId, newPassword, adminNotes } = req.body;
        if (!requestId || !newPassword) {
            return res.status(400).json({ success: false, message: 'Request ID and new password are required.' });
        }

        const reqRes = await pool.query('SELECT * FROM password_reset_requests WHERE id = $1', [requestId]);
        if (reqRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Request not found.' });
        }

        const requestItem = reqRes.rows[0];
        let userId = requestItem.user_id;

        if (!userId) {
            const uFind = await pool.query('SELECT id FROM users WHERE email = $1 OR phone = $1', [requestItem.identifier]);
            if (uFind.rows.length > 0) userId = uFind.rows[0].id;
        }

        if (userId) {
            await pool.query(
                'UPDATE users SET password_hash = $1, failed_login_count = 0, is_locked = false WHERE id = $2',
                [await hashPassword(newPassword.trim()), userId]
            );
        }

        const updatedReq = await pool.query(`
            UPDATE password_reset_requests
            SET status = 'resolved', temp_password = NULL, resolved_by = 'Shop Admin', resolved_at = NOW(), reason = COALESCE($2, reason)
            WHERE id = $3
            RETURNING *;
        `, [newPassword.trim(), adminNotes, requestId]);

        return res.status(200).json({
            success: true,
            message: 'Staff password has been reset successfully!',
            data: updatedReq.rows[0]
        });
    } catch (err) {
        console.error('resolveStaffRecovery error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};
