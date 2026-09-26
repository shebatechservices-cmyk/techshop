const pool = require('../../config/db');

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

module.exports = {
    ensureSecurityTables
};
