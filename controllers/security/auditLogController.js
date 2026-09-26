const pool = require('../../config/db');
const { ensureWalletSchema, writeWalletLedger } = require('../walletController');
const { hashPassword } = require('../../config/auth');
const { ensureSecurityTables } = require('./securitySchema');

// Global Audit Log Creation
exports.createAuditLog = async (userId, action, tableName, recordId, oldData, newData, ipAddress, severity = 'INFO', deviceId = null) => {
    try {
        await ensureSecurityTables();
        const query = `
            INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data, ip_address, severity, device_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `;
        await pool.query(query, [
            userId || null,
            action,
            tableName,
            recordId || null,
            oldData ? JSON.stringify(oldData) : null,
            newData ? JSON.stringify(newData) : null,
            ipAddress || '127.0.0.1',
            severity,
            deviceId || null
        ]);
    } catch (error) {
        console.error('Audit log creation error:', error.message);
    }
};

// 1. Get Security Overview & Health Metrics
exports.getSecurityOverview = async (req, res) => {
    try {
        await ensureSecurityTables();
        const [usersRes, devicesRes, ipRes, logsRes] = await Promise.all([
            pool.query("SELECT id, is_active, is_locked, role_name FROM users"),
            pool.query("SELECT id, is_authorized FROM trusted_devices"),
            pool.query("SELECT rule_type, blocked_attempts FROM ip_rules"),
            pool.query("SELECT id, severity FROM audit_logs WHERE created_at >= NOW() - INTERVAL '24 HOURS'")
        ]);

        const totalUsers = usersRes.rows.length;
        const activeUsers = usersRes.rows.filter(u => u.is_active && !u.is_locked).length;
        const lockedUsers = usersRes.rows.filter(u => u.is_locked).length;
        const technicians = usersRes.rows.filter(u => (u.role_name || '').toLowerCase().includes('technician')).length;

        const totalDevices = devicesRes.rows.length;
        const authorizedDevices = devicesRes.rows.filter(d => d.is_authorized).length;

        let totalBlockedAttempts = 0;
        ipRes.rows.forEach(r => {
            if (r.rule_type === 'block') totalBlockedAttempts += (Number(r.blocked_attempts) || 0);
        });

        const recentCriticals = logsRes.rows.filter(l => l.severity === 'CRITICAL' || l.severity === 'BLOCKED').length;

        // Dynamic Health Score calculation
        let healthScore = 98;
        if (lockedUsers > 0) healthScore -= 2;
        if (recentCriticals > 5) healthScore -= 5;
        if (totalDevices > authorizedDevices) healthScore -= 3;

        return res.status(200).json({
            success: true,
            data: {
                healthScore: Math.max(80, healthScore),
                totalUsers,
                activeUsers,
                lockedUsers,
                technicians,
                totalDevices,
                authorizedDevices,
                totalBlockedAttempts,
                recentCriticals,
                ipRulesCount: ipRes.rows.length,
                perimeterStatus: 'ACTIVE_SHIELD'
            }
        });
    } catch (error) {
        console.error('Get security overview error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Get Audit Logs
exports.getAuditLogs = async (req, res) => {
    try {
        await ensureSecurityTables();
        const { severity, limit = 200 } = req.query;
        let query = `
            SELECT
                l.*,
                u.name as user_name,
                u.phone as user_phone,
                u.role_name
            FROM audit_logs l
            LEFT JOIN users u ON l.user_id = u.id
        `;
        const params = [];
        if (severity && severity !== 'ALL') {
            query += " WHERE l.severity = $1";
            params.push(severity.toUpperCase());
        }
        const maxLimit = Math.min(parseInt(limit, 10) || 200, 500);
        query += ` ORDER BY l.id DESC LIMIT $${params.length + 1};`;
        params.push(maxLimit);
        const result = await pool.query(query, params);
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get audit logs error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Get Staff & Technicians
exports.getUsers = async (req, res) => {
    try {
        await ensureSecurityTables();
        const query = `
            SELECT
                u.id,
                u.name,
                u.phone,
                u.email,
                u.is_active,
                u.is_locked,
                u.failed_login_count,
                u.last_login,
                u.device_id,
                u.allowed_ip,
                u.role_id,
                COALESCE(r.name, u.role_name, 'Staff') as role_name,
                u.created_at
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.deleted_at IS NULL
            ORDER BY u.id ASC;
        `;
        const result = await pool.query(query);
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get users error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 4. Create Staff / Technician
exports.createUser = async (req, res) => {
    try {
        await ensureSecurityTables();
        const { name, phone, email, password, role_id, role_name, device_id, allowed_ip, opening_wallet_balance = 0 } = req.body;
        if (!name || !phone) {
            return res.status(400).json({ success: false, message: "Please provide name and phone number." });
        }
        const openingWallet = Number.parseFloat(opening_wallet_balance || 0) || 0;
        if (openingWallet < 0) {
            return res.status(400).json({ success: false, message: "Opening wallet balance cannot be negative." });
        }

        await ensureWalletSchema();
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const query = `
                INSERT INTO users (name, phone, email, password_hash, role_id, role_name, device_id, allowed_ip, wallet_balance, is_active)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
                RETURNING id, name, phone, email, role_id, role_name, device_id, allowed_ip, is_active, created_at;
            `;
            const result = await client.query(query, [
                name.trim(),
                phone.trim(),
                email ? email.trim() : null,
                await hashPassword(password || require('crypto').randomBytes(24).toString('base64url')),
                role_id ? parseInt(role_id, 10) : 4,
                role_name || 'Field Technician',
                device_id ? device_id.trim() : null,
                allowed_ip ? allowed_ip.trim() : 'Any IP',
                openingWallet
            ]);
            const staff = result.rows[0];
            if (openingWallet > 0) {
                await writeWalletLedger(client, {
                    party_type: 'staff',
                    party_id: staff.id,
                    party_name: staff.name,
                    type: 'opening_balance',
                    amount: openingWallet,
                    credit: true,
                    account_effect: 'none',
                    cash_drawer_effect: 'none',
                    reference: 'opening_balance',
                    note: 'Opening wallet balance at staff creation',
                    balance_before: 0,
                    balance_after: openingWallet,
                });
            }
            await client.query('COMMIT');
            return res.status(201).json({ success: true, message: "User/Technician added successfully!", data: staff });
        } catch (e2) {
            await client.query('ROLLBACK');
            throw e2;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Create user error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 5. Update User Status / Reset Lock
exports.updateUserStatus = async (req, res) => {
    try {
        await ensureSecurityTables();
        const { id } = req.params;
        const { is_locked, is_active, device_id, allowed_ip, role_name, role_id } = req.body;

        const result = await pool.query(`
            UPDATE users
            SET
                is_locked = COALESCE($1, is_locked),
                is_active = COALESCE($2, is_active),
                device_id = COALESCE($3, device_id),
                allowed_ip = COALESCE($4, allowed_ip),
                role_name = COALESCE($5, role_name),
                role_id = COALESCE($6, role_id),
                failed_login_count = CASE WHEN $1 = false THEN 0 ELSE failed_login_count END
            WHERE id = $7
            RETURNING id, name, phone, is_locked, is_active, device_id, allowed_ip, role_name;
        `, [is_locked, is_active, device_id, allowed_ip, role_name, role_id, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        return res.status(200).json({ success: true, message: "User access updated successfully.", data: result.rows[0] });
    } catch (error) {
        console.error('Update user status error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

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

// Get Pending Staff Registrations (For Admin Confirmation)
exports.getPendingStaff = async (req, res) => {
    try {
        await ensureSecurityTables();
        const result = await pool.query(`
            SELECT id, name, phone, email, role_name, approval_status, created_at
            FROM users
            WHERE approval_status = 'pending_approval' AND deleted_at IS NULL
            ORDER BY id DESC;
        `);
        return res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Approve / Reject Staff Registration
exports.approveStaff = async (req, res) => {
    try {
        await ensureSecurityTables();
        const { userId, action = 'approve' } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }
        if (action === 'approve') {
            await pool.query(`
                UPDATE users
                SET approval_status = 'approved', is_active = true
                WHERE id = $1
            `, [userId]);
            return res.status(200).json({ success: true, message: 'Staff account approved successfully.' });
        } else {
            await pool.query(`
                UPDATE users
                SET approval_status = 'rejected', is_active = false, deleted_at = NOW()
                WHERE id = $1
            `, [userId]);
            return res.status(200).json({ success: true, message: 'Staff account rejected.' });
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
