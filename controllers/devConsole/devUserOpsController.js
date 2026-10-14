const pool = require('../../config/db');
const { hashPassword, createSessionToken } = require('../../config/auth');
const { hashSessionToken } = require('../../middlewares/authMiddleware');

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

// Get All Users (Developer Console)
exports.getDeveloperUsers = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, name, email, phone, role_id, role_name, is_active, is_locked, failed_login_count, last_login, created_at, updated_at
            FROM users
            ORDER BY id ASC;
        `);
        return res.status(200).json({ success: true, count: result.rows.length, data: result.rows });
    } catch (err) {
        console.error('getDeveloperUsers error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Create User (Developer Console)
exports.createDeveloperUser = async (req, res) => {
    try {
        const { name, email, phone, password, role_id = 2, role_name = 'Sales Executive', is_active = true } = req.body;
        if (!name || (!email && !phone) || !password) {
            return res.status(400).json({ success: false, message: 'Name, Password, and at least one of Email/Phone are required.' });
        }

        const cleanName = String(name).trim();
        const cleanEmail = email ? String(email).trim().toLowerCase() : null;
        const cleanPhone = phone ? String(phone).trim() : null;
        const cleanPassword = String(password).trim();

        const result = await pool.query(`
            INSERT INTO users (name, email, phone, password_hash, role_id, role_name, is_active, is_locked)
            VALUES ($1, $2, $3, $4, $5, $6, $7, false)
            RETURNING id, name, email, phone, role_id, role_name, is_active, is_locked, created_at;
        `, [cleanName, cleanEmail, cleanPhone, await hashPassword(cleanPassword), parseInt(role_id, 10) || 2, role_name, Boolean(is_active)]);

        return res.status(201).json({ success: true, message: 'User created successfully!', user: result.rows[0] });
    } catch (err) {
        console.error('createDeveloperUser error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Update User (Developer Console)
exports.updateDeveloperUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, password, role_id, role_name, is_active, is_locked } = req.body;

        const existing = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        const user = existing.rows[0];

        const updatedName = name !== undefined ? String(name).trim() : user.name;
        const updatedEmail = email !== undefined ? (email ? String(email).trim().toLowerCase() : null) : user.email;
        const updatedPhone = phone !== undefined ? (phone ? String(phone).trim() : null) : user.phone;
        const updatedPassword = (password && String(password).trim()) ? await hashPassword(String(password).trim()) : user.password_hash;
        const updatedRoleId = role_id !== undefined ? (parseInt(role_id, 10) || user.role_id) : user.role_id;
        const updatedRoleName = role_name !== undefined ? role_name : user.role_name;
        const updatedIsActive = is_active !== undefined ? Boolean(is_active) : user.is_active;
        const updatedIsLocked = is_locked !== undefined ? Boolean(is_locked) : user.is_locked;

        const result = await pool.query(`
            UPDATE users
            SET name = $1, email = $2, phone = $3, password_hash = $4, role_id = $5, role_name = $6, is_active = $7, is_locked = $8, updated_at = NOW()
            WHERE id = $9
            RETURNING id, name, email, phone, role_id, role_name, is_active, is_locked, updated_at;
        `, [updatedName, updatedEmail, updatedPhone, updatedPassword, updatedRoleId, updatedRoleName, updatedIsActive, updatedIsLocked, id]);

        return res.status(200).json({ success: true, message: 'User updated successfully!', user: result.rows[0] });
    } catch (err) {
        console.error('updateDeveloperUser error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Delete User (Developer Console)
exports.deleteDeveloperUser = async (req, res) => {
    try {
        const { id } = req.params;
        const check = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (check.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const user = check.rows[0];
        if (user.role_id === 1) {
            // Ensure there is at least one other active Super Admin
            const adminCount = await pool.query('SELECT COUNT(*) FROM users WHERE role_id = 1 AND is_active = true AND id != $1', [id]);
            if (parseInt(adminCount.rows[0].count, 10) === 0) {
                return res.status(400).json({ success: false, message: 'Cannot delete the only Super Admin account. Create another Super Admin first.' });
            }
        }

        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        return res.status(200).json({ success: true, message: `User #${id} (${user.name}) deleted successfully.` });
    } catch (err) {
        console.error('deleteDeveloperUser error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Generate Developer Bypass Token
exports.generateDeveloperBypassToken = async (req, res) => {
    try {
        const { targetUserId } = req.body;
        let query = 'SELECT * FROM users WHERE role_id = 1 AND deleted_at IS NULL ORDER BY id ASC LIMIT 1';
        let params = [];
        if (targetUserId) {
            query = 'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL';
            params = [targetUserId];
        }

        const result = await pool.query(query, params);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Target user not found.' });
        }

        const user = result.rows[0];
        const token = createSessionToken();
        const tokenHash = hashSessionToken(token);

        await pool.query(`
            UPDATE users
            SET current_session_token = $1, session_last_active = NOW(), failed_login_count = 0, is_locked = false, is_active = true
            WHERE id = $2
        `, [tokenHash, user.id]);

        return res.status(200).json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role_id: user.role_id,
                role_name: user.role_name || 'Super Admin',
                is_active: true
            }
        });
    } catch (err) {
        console.error('generateDeveloperBypassToken error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};
