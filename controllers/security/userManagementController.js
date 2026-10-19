const pool = require('../../config/db');
const { ensureWalletSchema, writeWalletLedger } = require('../walletController');
const { hashPassword } = require('../../config/auth');
const { ensureSecurityTables } = require('./securitySchema');

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
