const pool = require('../../config/db');
const { hashPassword } = require('../../config/auth');
const { ensureSecurityTables } = require('./securitySchema');

// 5a. Update User Details (Edit Staff / Technician)
exports.updateUser = async (req, res) => {
    try {
        await ensureSecurityTables();
        const { id } = req.params;
        const { name, phone, email, password, role_id, role_name, device_id, allowed_ip, is_locked, is_active } = req.body;

        const checkRes = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (!checkRes.rows.length) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const updateFields = [];
        const values = [];

        if (name !== undefined) {
            values.push(name.trim());
            updateFields.push(`name = $${values.length}`);
        }
        if (phone !== undefined) {
            values.push(phone.trim());
            updateFields.push(`phone = $${values.length}`);
        }
        if (email !== undefined) {
            values.push(email ? email.trim() : null);
            updateFields.push(`email = $${values.length}`);
        }
        if (password) {
            values.push(await hashPassword(password.trim()));
            updateFields.push(`password_hash = $${values.length}`);
        }
        if (role_id !== undefined) {
            values.push(parseInt(role_id, 10));
            updateFields.push(`role_id = $${values.length}`);
        }
        if (role_name !== undefined) {
            values.push(role_name);
            updateFields.push(`role_name = $${values.length}`);
        }
        if (device_id !== undefined) {
            values.push(device_id ? device_id.trim() : null);
            updateFields.push(`device_id = $${values.length}`);
        }
        if (allowed_ip !== undefined) {
            values.push(allowed_ip ? allowed_ip.trim() : 'Any IP');
            updateFields.push(`allowed_ip = $${values.length}`);
        }
        if (is_locked !== undefined) {
            values.push(Boolean(is_locked));
            updateFields.push(`is_locked = $${values.length}`);
        }
        if (is_active !== undefined) {
            values.push(Boolean(is_active));
            updateFields.push(`is_active = $${values.length}`);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields provided to update.' });
        }

        values.push(id);
        const query = `
            UPDATE users
            SET ${updateFields.join(', ')}, updated_at = NOW()
            WHERE id = $${values.length}
            RETURNING id, name, phone, email, role_id, role_name, device_id, allowed_ip, is_locked, is_active;
        `;
        const result = await pool.query(query, values);

        return res.status(200).json({
            success: true,
            message: `User "${result.rows[0].name}" updated successfully!`,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Update user error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 5b. Delete User (Staff / Technician)
exports.deleteUser = async (req, res) => {
    try {
        await ensureSecurityTables();
        const { id } = req.params;
        const userId = parseInt(id, 10);

        if (userId === 1) {
            return res.status(400).json({ success: false, message: 'Super Admin account (ID 1) cannot be deleted.' });
        }

        const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (!userRes.rows.length) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const user = userRes.rows[0];

        // Soft delete & backup in trash_records
        await pool.query('UPDATE users SET deleted_at = NOW(), is_active = false WHERE id = $1', [userId]);
        await pool.query(`
            INSERT INTO trash_records (table_name, record_id, record_title, record_data, deleted_at)
            VALUES ('users', $1, $2, $3, NOW())
        `, [userId, `Staff/Tech: ${user.name} (${user.role_name || 'Staff'})`, JSON.stringify(user)]).catch(() => null);

        // Audit log
        await pool.query(`
            INSERT INTO audit_logs (user_id, action, table_name, record_id, severity)
            VALUES ($1, 'DELETE_USER', 'users', $2, 'WARNING');
        `, [1, userId]).catch(() => null);

        return res.status(200).json({
            success: true,
            message: `Staff member "${user.name}" moved to Trash successfully!`
        });
    } catch (error) {
        console.error('Delete user error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
