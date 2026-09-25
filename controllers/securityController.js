const pool = require('../config/db');
const { ensureWalletSchema, writeWalletLedger } = require('./walletController');
const { hashPassword, verifyPassword, isPasswordHash, createSessionToken } = require('../config/auth');
const { hashSessionToken } = require('../middlewares/authMiddleware');

let tablesMigrated = false;

async function ensureSecurityTables() {
    if (tablesMigrated) return;
    try {
        await pool.query(`
            -- Trusted Devices Table
            CREATE TABLE IF NOT EXISTS trusted_devices (
                id SERIAL PRIMARY KEY,
                device_id VARCHAR(100) NOT NULL UNIQUE,
                device_name VARCHAR(150) NOT NULL,
                user_id INT REFERENCES users(id) ON DELETE SET NULL,
                device_type VARCHAR(50) DEFAULT 'desktop',
                browser_info VARCHAR(255),
                ip_address VARCHAR(50),
                is_authorized BOOLEAN DEFAULT true,
                last_active TIMESTAMP DEFAULT NOW(),
                created_at TIMESTAMP DEFAULT NOW()
            );

            -- IP Rules Table (Firewall Whitelist & Blacklist)
            CREATE TABLE IF NOT EXISTS ip_rules (
                id SERIAL PRIMARY KEY,
                ip_address VARCHAR(50) NOT NULL UNIQUE,
                rule_type VARCHAR(20) NOT NULL DEFAULT 'block',
                reason VARCHAR(255),
                blocked_attempts INT DEFAULT 0,
                created_by INT REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );

            -- Security Settings Key-Value
            CREATE TABLE IF NOT EXISTS security_settings (
                id SERIAL PRIMARY KEY,
                setting_key VARCHAR(100) NOT NULL UNIQUE,
                setting_value TEXT,
                updated_at TIMESTAMP DEFAULT NOW()
            );

            -- Ensure columns in audit_logs
            ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'INFO';
            ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS device_id VARCHAR(100);

            ALTER TABLE users ADD COLUMN IF NOT EXISTS device_id VARCHAR(100);
            ALTER TABLE users ADD COLUMN IF NOT EXISTS allowed_ip VARCHAR(50);
            ALTER TABLE users ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_count INT DEFAULT 0;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
            ALTER TABLE users ADD COLUMN IF NOT EXISTS role_name VARCHAR(50);
            ALTER TABLE users ADD COLUMN IF NOT EXISTS current_session_token VARCHAR(255);
            ALTER TABLE users ADD COLUMN IF NOT EXISTS session_last_active TIMESTAMP DEFAULT NOW();
            ALTER TABLE users ADD COLUMN IF NOT EXISTS browser_fingerprint VARCHAR(255);
            ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'approved';

            -- Password Reset Requests
            CREATE TABLE IF NOT EXISTS password_reset_requests (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                user_name VARCHAR(200),
                identifier VARCHAR(200) NOT NULL,
                user_type VARCHAR(50) NOT NULL,
                target_role VARCHAR(50) NOT NULL,
                contact_phone VARCHAR(50),
                shop_name VARCHAR(200),
                reason TEXT,
                status VARCHAR(50) DEFAULT 'pending',
                temp_password VARCHAR(100),
                resolved_by VARCHAR(100),
                resolved_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_reset_req_target_status ON password_reset_requests(target_role, status);

            -- Ensure role 5 for self-registered Online Users
            INSERT INTO roles (id, name, permissions)
            VALUES (5, 'Customer / Online User', '[]'::jsonb)
            ON CONFLICT (id) DO NOTHING;
        `);

        // Seed sample IP rules if empty
        const ipCheck = await pool.query("SELECT COUNT(*) FROM ip_rules");
        if (parseInt(ipCheck.rows[0].count, 10) === 0) {
            await pool.query(`
                INSERT INTO ip_rules (ip_address, rule_type, reason, blocked_attempts) VALUES
                ('103.145.118.42', 'whitelist', 'Sheba Tech Main Office Broadband (Static)', 0),
                ('192.168.1.100', 'whitelist', 'Shop LAN POS Terminal Subnet', 0),
                ('185.220.101.5', 'block', 'Detected Tor exit node spam login attempts', 42),
                ('45.154.255.89', 'block', 'Brute-force credential stuffing attack', 119)
                ON CONFLICT (ip_address) DO NOTHING;
            `);
        }

        // Seed trusted devices if empty
        const devCheck = await pool.query("SELECT COUNT(*) FROM trusted_devices");
        if (parseInt(devCheck.rows[0].count, 10) === 0) {
            await pool.query(`
                INSERT INTO trusted_devices (device_id, device_name, device_type, browser_info, ip_address, is_authorized) VALUES
                ('DEV-POS-01-DESK', 'Main Counter POS Terminal 1', 'pos_terminal', 'Chrome 124 / Windows 11 POS', '192.168.1.101', true),
                ('DEV-ADMIN-LP-02', 'Admin Office ThinkPad Laptop', 'desktop', 'Chrome 125 / Linux Ubuntu', '103.145.118.42', true),
                ('DEV-TECH-MOB-01', 'Al-Amin Technician Samsung Galaxy', 'mobile', 'Sheba Tech PWA / Android 14', 'Mobile Network 4G', true),
                ('DEV-TECH-MOB-02', 'Sabbir Hossain Field Xiaomi Note', 'mobile', 'Sheba Tech PWA / Android 13', 'Mobile Network 4G', true),
                ('DEV-UNAUTH-UNKNOWN', 'Unrecognized Mac Device (Attempted Login)', 'desktop', 'Safari 17 / macOS 14', '185.220.101.5', false)
                ON CONFLICT (device_id) DO NOTHING;
            `);
        }

        // Seed initial audit events if empty
        const logCheck = await pool.query("SELECT COUNT(*) FROM audit_logs");
        if (parseInt(logCheck.rows[0].count, 10) === 0) {
            await pool.query(`
                INSERT INTO audit_logs (user_id, action, table_name, record_id, ip_address, severity, device_id, created_at) VALUES
                (1, 'USER_LOGIN_SUCCESS', 'users', 1, '103.145.118.42', 'INFO', 'DEV-ADMIN-LP-02', NOW() - INTERVAL '12 minutes'),
                (NULL, 'SPAM_BRUTEFORCE_BLOCKED', 'auth', NULL, '185.220.101.5', 'BLOCKED', 'DEV-UNAUTH-UNKNOWN', NOW() - INTERVAL '45 minutes'),
                (3, 'TECH_PROJECT_ASSIGNED', 'service_projects', 14, 'Mobile Network 4G', 'INFO', 'DEV-TECH-MOB-01', NOW() - INTERVAL '2 hours'),
                (2, 'PRICE_MARGIN_PEEK', 'sales', 108, '192.168.1.101', 'WARNING', 'DEV-POS-01-DESK', NOW() - INTERVAL '3 hours'),
                (NULL, 'UNAUTHORIZED_IP_REJECTED', 'firewall', NULL, '45.154.255.89', 'CRITICAL', 'UNKNOWN', NOW() - INTERVAL '5 hours'),
                (1, 'ROLE_PERMISSION_UPDATED', 'roles', 4, '103.145.118.42', 'INFO', 'DEV-ADMIN-LP-02', NOW() - INTERVAL '1 day');
            `);
        }

        tablesMigrated = true;
    } catch (e) {
        console.warn("Security tables migration notice:", e.message);
    }
}

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

// 6. Get Trusted Devices
exports.getDevices = async (req, res) => {
    try {
        await ensureSecurityTables();
        const query = `
            SELECT
                d.*,
                u.name as user_name,
                u.role_name
            FROM trusted_devices d
            LEFT JOIN users u ON d.user_id = u.id
            ORDER BY d.id DESC;
        `;
        const result = await pool.query(query);
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get devices error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 7. Authorize / Register Device
exports.createDevice = async (req, res) => {
    try {
        await ensureSecurityTables();
        const { device_id, device_name, device_type, user_id, browser_info, ip_address } = req.body;
        if (!device_id || !device_name) {
            return res.status(400).json({ success: false, message: "ডিভাইস আইডি এবং নাম প্রদান করুন।" });
        }

        const query = `
            INSERT INTO trusted_devices (device_id, device_name, device_type, user_id, browser_info, ip_address, is_authorized)
            VALUES ($1, $2, $3, $4, $5, $6, true)
            ON CONFLICT (device_id) DO UPDATE SET
                device_name = EXCLUDED.device_name,
                is_authorized = true,
                last_active = NOW()
            RETURNING *;
        `;
        const result = await pool.query(query, [
            device_id.trim(),
            device_name.trim(),
            device_type || 'desktop',
            user_id ? parseInt(user_id, 10) : null,
            browser_info || null,
            ip_address || null
        ]);

        return res.status(201).json({ success: true, message: "ডিভাইস সফলভাবে অথরাইজ করা হয়েছে!", data: result.rows[0] });
    } catch (error) {
        console.error('Create device error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 8. Update Device Status (Authorize / Revoke)
exports.updateDeviceStatus = async (req, res) => {
    try {
        await ensureSecurityTables();
        const { id } = req.params;
        const { is_authorized } = req.body;

        const result = await pool.query(
            "UPDATE trusted_devices SET is_authorized = $1, last_active = NOW() WHERE id = $2 RETURNING *",
            [Boolean(is_authorized), id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "ডিভাইস পাওয়া যায়নি।" });
        }
        return res.status(200).json({ success: true, message: `ডিভাইসটি ${is_authorized ? 'অথরাইজ' : 'ব্লক/রিভোক'} করা হয়েছে।`, data: result.rows[0] });
    } catch (error) {
        console.error('Update device status error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 9. Delete Device
exports.deleteDevice = async (req, res) => {
    try {
        await ensureSecurityTables();
        const { id } = req.params;
        await pool.query("DELETE FROM trusted_devices WHERE id = $1", [id]);
        return res.status(200).json({ success: true, message: "ডিভাইস তালিকা থেকে মুছে ফেলা হয়েছে।" });
    } catch (error) {
        console.error('Delete device error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 10. Get IP Rules (Firewall Whitelist & Blacklist)
exports.getIpRules = async (req, res) => {
    try {
        await ensureSecurityTables();
        const result = await pool.query("SELECT * FROM ip_rules ORDER BY id DESC;");
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get IP rules error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 11. Create IP Rule (Whitelist / Blacklist)
exports.createIpRule = async (req, res) => {
    try {
        await ensureSecurityTables();
        const { ip_address, rule_type = 'block', reason } = req.body;
        if (!ip_address) {
            return res.status(400).json({ success: false, message: "আইপি অ্যাড্রেস দিন।" });
        }

        const query = `
            INSERT INTO ip_rules (ip_address, rule_type, reason, blocked_attempts)
            VALUES ($1, $2, $3, 0)
            ON CONFLICT (ip_address) DO UPDATE SET
                rule_type = EXCLUDED.rule_type,
                reason = EXCLUDED.reason
            RETURNING *;
        `;
        const result = await pool.query(query, [ip_address.trim(), rule_type, reason || null]);
        return res.status(201).json({ success: true, message: `IP Rule (${rule_type.toUpperCase()}) সফলভাবে সংরক্ষণ হয়েছে!`, data: result.rows[0] });
    } catch (error) {
        console.error('Create IP rule error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 12. Delete IP Rule
exports.deleteIpRule = async (req, res) => {
    try {
        await ensureSecurityTables();
        const { id } = req.params;
        await pool.query("DELETE FROM ip_rules WHERE id = $1", [id]);
        return res.status(200).json({ success: true, message: "IP রুল মুছে ফেলা হয়েছে।" });
    } catch (error) {
        console.error('Delete IP rule error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 13. User Authentication / Login (Standard Multi-device & Multi-tab Authentication)
exports.login = async (req, res) => {
    try {
        await ensureSecurityTables();
        const { email, phone, username, password, device_id, device_name, device_type, browser_info } = req.body;
        const rawIdentifier = (email || phone || username || '').trim();
        const pass = (password || '').trim();

        if (!rawIdentifier || !pass) {
            return res.status(400).json({
                success: false,
                message: 'মোবাইল নম্বর অথবা ইমেইল এবং পাসওয়ার্ড প্রদান করুন।'
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

        // Dynamic Database User Lookup by Phone or Email (no alias shortcuts)
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
                message: 'ইউজার পাওয়া যায়নি! আপনার মোবাইল নম্বর অথবা ইমেইল সঠিকভাবে যাচাই করুন।'
            });
        }

        const user = result.rows[0];
        const isSuperAdmin = user.role_id === 1;

        // Check Admin Approval Status for Staff
        if (user.approval_status === 'pending_approval') {
            return res.status(403).json({
                success: false,
                message: 'আপনার স্টাফ/টেকনিশিয়ান একাউন্টটি শপ এডমিন কর্তৃক অনুমোদনের অপেক্ষায় রয়েছে। এডমিন অনুমোদন দিলে লগইন করতে পারবেন।'
            });
        }

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'এই একাউন্টটি নিষ্ক্রিয় করা হয়েছে। অ্যাডমিনের সাথে যোগাযোগ করুন।'
            });
        }

        // Super Admin is never locked out
        if (user.is_locked && !isSuperAdmin) {
            return res.status(403).json({
                success: false,
                message: 'অতিরিক্ত ভুল চেষ্টার কারণে একাউন্ট সাময়িক লক করা হয়েছে। অ্যাডমিনের সাহায্য নিন।'
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
                    ? 'টানা ৫ বার ভুল পাসওয়ার্ড দেওয়ার কারণে একাউন্ট লক করা হয়েছে।'
                    : `ভুল পাসওয়ার্ড! অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন। (ভুল চেষ্টা: ${newFailCount}/5)`
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
            message: 'লগইন সফল হয়েছে!',
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
        return res.status(500).json({ success: false, message: 'সার্ভার ত্রুটি: ' + error.message });
    }
};

// 14. Sign Up (Online User Auto-approved vs Staff/Technician Admin-confirmed)
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
                message: 'নাম, মোবাইল/ইমেইল এবং পাসওয়ার্ড আবশ্যক।'
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
                message: 'এই মোবাইল নম্বর বা ইমেইল দিয়ে ইতোমধ্যে একটি একাউন্ট তৈরি করা আছে!'
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
                message: 'অনলাইন ইউজার হিসেবে রেজিস্ট্রেশন সফল হয়েছে!',
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
                message: 'স্টাফ/টেকনিশিয়ান রেজিস্ট্রেশন সম্পন্ন হয়েছে! শপ এডমিন অনুমোদন (Approve) করলে আপনি লগইন করতে পারবেন।',
                user: newUser
            });
        }
    } catch (err) {
        console.error('Signup error:', err);
        return res.status(500).json({ success: false, message: 'রেজিস্ট্রেশন ত্রুটি: ' + err.message });
    }
};

// 14a. Logout & Release Single-Browser Session Lock
exports.logout = async (req, res) => {
    try {
        const token = req.headers['authorization']?.replace('Bearer ', '') || req.headers['x-session-token'] || req.body?.token;
        if (token) {
            await pool.query('UPDATE users SET current_session_token = NULL WHERE current_session_token = $1', [hashSessionToken(token)]);
        }
        return res.status(200).json({ success: true, message: 'সফলভাবে লগআউট করা হয়েছে।' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 14b. Verify Session Heartbeat (Standard session validation, never kicks multi-tab)
exports.verifySession = async (req, res) => {
    try {
        return res.status(200).json({ active: true, user: req.user });
    } catch (err) {
        return res.status(500).json({ active: false, error: err.message });
    }
};

// 14c. Get Pending Staff Registrations (For Admin Confirmation)
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

// 14d. Approve / Reject Staff Registration
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
            return res.status(200).json({ success: true, message: 'স্টাফের একাউন্ট সফলভাবে অনুমোদন করা হয়েছে।' });
        } else {
            await pool.query(`
                UPDATE users
                SET approval_status = 'rejected', is_active = false, deleted_at = NOW()
                WHERE id = $1
            `, [userId]);
            return res.status(200).json({ success: true, message: 'স্টাফের একাউন্ট বাতিল করা হয়েছে।' });
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 14e. Get Current User Session
exports.getCurrentUser = async (req, res) => {
    return res.status(200).json({ success: true, active: true });
};

// 15. Submit Forgot ID / Password Recovery Request (Staff -> Admin OR Admin -> Developer)
exports.submitRecoveryRequest = async (req, res) => {
    try {
        await ensureSecurityTables();
        const { identifier, user_type = 'staff', shop_name = '', contact_phone = '', reason = '' } = req.body;
        const cleanId = (identifier || '').trim();

        if (!cleanId) {
            return res.status(400).json({
                success: false,
                message: 'অনুগ্রহ করে আপনার মোবাইল নম্বর অথবা ইমেইল প্রদান করুন।'
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
                ? 'এডমিন পাসওয়ার্ড রিকভারি অনুরোধটি সিস্টেম ডেভেলপারের কাছে সফলভাবে পাঠানো হয়েছে। ডেভেলপার এটি যাচাই করে রিসেট করবেন।'
                : 'স্টাফ পাসওয়ার্ড রিকভারি অনুরোধটি শপ এডমিনের কাছে সফলভাবে পাঠানো হয়েছে। এডমিন প্যানেল থেকে পাসওয়ার্ড রিসেট করবেন।',
            target_role: targetRole,
            data: insRes.rows[0]
        });
    } catch (err) {
        console.error('submitRecoveryRequest error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 16. Get Staff Recovery Requests (For App Admin)
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

// 17. Resolve Staff Recovery (App Admin sets new password)
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
            message: 'স্টাফের পাসওয়ার্ড সফলভাবে রিসেট করা হয়েছে!',
            data: updatedReq.rows[0]
        });
    } catch (err) {
        console.error('resolveStaffRecovery error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};
