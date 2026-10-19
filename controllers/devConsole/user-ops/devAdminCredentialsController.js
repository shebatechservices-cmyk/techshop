const pool = require('../../../config/db');
const { hashPassword } = require('../../../config/auth');

// Get App User Admin Credentials (Developer Console)
exports.getAppAdminCredentials = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, name, email, phone, role_id, role_name, is_active, is_locked, last_login, created_at, updated_at
            FROM users
            WHERE role_id = 1 OR role_name ILIKE '%super admin%'
            ORDER BY id ASC
            LIMIT 1;
        `);

        if (result.rows.length === 0) {
            return res.status(200).json({
                success: true,
                exists: false,
                message: 'No App User Admin found in database.'
            });
        }

        return res.status(200).json({
            success: true,
            exists: true,
            admin: result.rows[0]
        });
    } catch (err) {
        console.error('getAppAdminCredentials error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Update or Initialize App User Admin Credentials (Developer Console)
exports.updateAppAdminCredentials = async (req, res) => {
    try {
        const { name, email, phone, password, is_active = true } = req.body;

        if (!name || (!email && !phone) || !password) {
            return res.status(400).json({
                success: false,
                message: 'Admin Name, at least one of Email/Phone, and Password are required.'
            });
        }

        const cleanName = name.trim();
        const cleanEmail = (email || '').trim().toLowerCase() || null;
        const cleanPhone = (phone || '').trim() || null;
        const cleanPassword = password.trim();

        // Check if admin exists
        const existing = await pool.query(`
            SELECT id FROM users 
            WHERE role_id = 1 OR role_name ILIKE '%super admin%' 
            ORDER BY id ASC LIMIT 1;
        `);

        let savedAdmin;
        if (existing.rows.length > 0) {
            const adminId = existing.rows[0].id;
            const updated = await pool.query(`
                UPDATE users
                SET name = $1, email = $2, phone = $3, password_hash = $4, is_active = $5, is_locked = false, failed_login_count = 0, updated_at = NOW()
                WHERE id = $6
                RETURNING id, name, email, phone, role_id, role_name, is_active, updated_at;
            `, [cleanName, cleanEmail, cleanPhone, await hashPassword(cleanPassword), Boolean(is_active), adminId]);
            savedAdmin = updated.rows[0];
        } else {
            const inserted = await pool.query(`
                INSERT INTO users (name, email, phone, password_hash, role_id, role_name, is_active)
                VALUES ($1, $2, $3, $4, 1, 'Super Admin', $5)
                RETURNING id, name, email, phone, role_id, role_name, is_active, created_at;
            `, [cleanName, cleanEmail, cleanPhone, await hashPassword(cleanPassword), Boolean(is_active)]);
            savedAdmin = inserted.rows[0];
        }

        // Record Developer Action in Audit Log
        await pool.query(`
            INSERT INTO audit_logs (user_id, action, table_name, record_id, ip_address, severity)
            VALUES ($1, 'DEV_UPDATE_ADMIN_CREDENTIALS', 'users', $1, $2, 'CRITICAL')
        `, [savedAdmin.id, req.headers['x-forwarded-for'] || '127.0.0.1']).catch(() => null);

        return res.status(200).json({
            success: true,
            message: 'App User Admin credentials successfully updated by Developer!',
            admin: savedAdmin
        });
    } catch (err) {
        console.error('updateAppAdminCredentials error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Get Admin Password Recovery Requests (Target Developer)
exports.getAdminRecoveryRequests = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM password_reset_requests
            WHERE target_role = 'developer'
            ORDER BY (status = 'pending') DESC, id DESC
            LIMIT 50;
        `);
        return res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        console.error('getAdminRecoveryRequests error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Resolve Admin Recovery Request (Developer Resets Admin Password)
exports.resolveAdminRecovery = async (req, res) => {
    try {
        const { requestId, newPassword, developerNotes } = req.body;
        if (!requestId || !newPassword) {
            return res.status(400).json({ success: false, message: 'Request ID and new password are required.' });
        }

        const reqRes = await pool.query('SELECT * FROM password_reset_requests WHERE id = $1', [requestId]);
        if (reqRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Request not found.' });
        }

        const requestItem = reqRes.rows[0];
        let adminId = requestItem.user_id;

        if (!adminId) {
            const aFind = await pool.query(`
                SELECT id FROM users 
                WHERE role_id = 1 OR role_name ILIKE '%super admin%' OR email = $1 OR phone = $1
                ORDER BY (role_id = 1) DESC LIMIT 1;
            `, [requestItem.identifier]);
            if (aFind.rows.length > 0) adminId = aFind.rows[0].id;
        }

        if (adminId) {
            await pool.query(
                'UPDATE users SET password_hash = $1, failed_login_count = 0, is_locked = false, is_active = true WHERE id = $2',
                [await hashPassword(newPassword.trim()), adminId]
            );
        }

        const updated = await pool.query(`
            UPDATE password_reset_requests
            SET status = 'resolved', temp_password = NULL, resolved_by = 'Developer Console', resolved_at = NOW(), reason = COALESCE($2, reason)
            WHERE id = $3
            RETURNING *;
        `, [newPassword.trim(), developerNotes, requestId]);

        return res.status(200).json({
            success: true,
            message: 'App Admin password successfully reset by Developer!',
            data: updated.rows[0]
        });
    } catch (err) {
        console.error('resolveAdminRecovery error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};
