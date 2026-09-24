const fs = require('fs');
const path = require('path');
const pool = require('./db');
const { hashPassword } = require('./auth');

async function autoInitDatabase() {
    try {
        const checkRes = await pool.query("SELECT to_regclass('public.users')");
        if (checkRes.rows[0].to_regclass) {
            // Ensure incremental schema additions for existing installations
            await pool.query(`
                ALTER TABLE users ADD COLUMN IF NOT EXISTS current_session_token VARCHAR(255);
                ALTER TABLE users ADD COLUMN IF NOT EXISTS session_last_active TIMESTAMP DEFAULT NOW();
                ALTER TABLE users ADD COLUMN IF NOT EXISTS browser_fingerprint VARCHAR(255);
                ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'approved';
                ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(14,2) DEFAULT 0;
                ALTER TABLE payment_accounts ADD COLUMN IF NOT EXISTS account_number VARCHAR(100);
                ALTER TABLE payment_accounts ADD COLUMN IF NOT EXISTS tender_id INTEGER REFERENCES tenders(id) ON DELETE SET NULL;
                ALTER TABLE products ADD COLUMN IF NOT EXISTS is_serial_tracked BOOLEAN DEFAULT false;
                ALTER TABLE products ADD COLUMN IF NOT EXISTS is_serial_required BOOLEAN DEFAULT false;
                ALTER TABLE products ADD COLUMN IF NOT EXISTS is_warranty_required BOOLEAN DEFAULT false;
                ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS client_app_id VARCHAR(100) DEFAULT 'CLIENT-SHEBA-TECH-8801';
                ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS security_pin VARCHAR(20) DEFAULT '1234';
                ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS allow_invoice_modification BOOLEAN DEFAULT true;
                ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS invoice_edit_time_limit_hours INT DEFAULT 360;
                ALTER TABLE vendor_license_cache ADD COLUMN IF NOT EXISTS client_app_id VARCHAR(100);

                -- Centralized Database-Driven Payment Methods System
                CREATE TABLE IF NOT EXISTS payment_methods (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100),
                    method_name VARCHAR(100) UNIQUE,
                    type VARCHAR(50) DEFAULT 'cash',
                    account_number VARCHAR(100),
                    is_active BOOLEAN DEFAULT true,
                    account_details TEXT,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW(),
                    deleted_at TIMESTAMP,
                    deleted_by INTEGER
                );

                ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS name VARCHAR(100);
                ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'cash';
                ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS account_number VARCHAR(100);
                ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
                ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
                ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
                ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS account_details TEXT;
                ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
                ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS deleted_by INTEGER;

                UPDATE payment_methods 
                SET name = COALESCE(name, method_name),
                    method_name = COALESCE(method_name, name)
                WHERE name IS NULL OR method_name IS NULL;

                ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS payment_method_id INTEGER REFERENCES payment_methods(id);
                ALTER TABLE purchase_order_payments ADD COLUMN IF NOT EXISTS payment_method_id INTEGER REFERENCES payment_methods(id);
                ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_method_id INTEGER REFERENCES payment_methods(id);

                -- Seed Essential Active Default Payment Methods
                INSERT INTO payment_methods (name, method_name, type, account_number, is_active, account_details, deleted_at) VALUES 
                ('Cash', 'Cash', 'cash', NULL, true, 'Default Cash Drawer in Shop', NULL),
                ('bKash', 'bKash', 'mobile_banking', '01700-000000', true, 'bKash Merchant / Personal Wallet', NULL),
                ('Nagad', 'Nagad', 'mobile_banking', '01800-000000', true, 'Nagad Merchant / Personal Wallet', NULL),
                ('Rocket', 'Rocket', 'mobile_banking', '01900-000000', true, 'DBBL Rocket MFS Account', NULL),
                ('Bank Transfer', 'Bank Transfer', 'bank', '1502938471001', true, 'Commercial Bank Account', NULL)
                ON CONFLICT (method_name) DO UPDATE SET
                    name = COALESCE(payment_methods.name, EXCLUDED.name),
                    type = COALESCE(payment_methods.type, EXCLUDED.type),
                    is_active = true,
                    deleted_at = NULL;

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

                CREATE TABLE IF NOT EXISTS tenders (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) UNIQUE NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS accounts (
                    id SERIAL PRIMARY KEY,
                    tender_id INTEGER REFERENCES tenders(id) ON DELETE RESTRICT,
                    account_name VARCHAR(200) NOT NULL,
                    location VARCHAR(255),
                    opening_balance NUMERIC(14,2) DEFAULT 0.00,
                    current_balance NUMERIC(14,2) DEFAULT 0.00,
                    reference_id VARCHAR(120),
                    created_by VARCHAR(150),
                    created_at TIMESTAMP DEFAULT NOW()
                );

                INSERT INTO tenders (name) VALUES 
                ('Cash'), 
                ('Bank'), 
                ('Mobile Banking (MFS)')
                ON CONFLICT (name) DO NOTHING;
            `).catch((err) => {
                console.warn('⚠️ Incremental database migration notice:', err.message);
            });
            return;
        }

        console.log('🔄 First-time deployment detected! Initializing database schema automatically...');
        const schemaPath = path.join(__dirname, '../database/clean_cloud_schema.sql');
        if (fs.existsSync(schemaPath)) {
            const sql = fs.readFileSync(schemaPath, 'utf8');
            await pool.query(sql);
            console.log('✅ Database schema initialized successfully! (All 57 tables created)');

            await pool.query(`
                INSERT INTO roles (id, name, permissions) VALUES 
                (1, 'Super Admin', '[]'),
                (2, 'Admin', '[]'),
                (3, 'Staff', '[]'),
                (4, 'Online Technician', '[]')
                ON CONFLICT (id) DO NOTHING;
            `);
            console.log('✅ Essential default roles created.');

            const initialPassword = process.env.INITIAL_ADMIN_PASSWORD;
            const initialEmail = process.env.INITIAL_ADMIN_EMAIL;
            const initialPhone = process.env.INITIAL_ADMIN_PHONE;
            if (initialPassword && (initialEmail || initialPhone)) {
                await pool.query(`
                    INSERT INTO users (name, email, phone, password_hash, role_id, role_name, is_active)
                    VALUES ($1, $2, $3, $4, 1, 'Super Admin', true)
                    ON CONFLICT DO NOTHING
                `, [
                    process.env.INITIAL_ADMIN_NAME || 'Super Admin',
                    initialEmail || null,
                    initialPhone || null,
                    await hashPassword(initialPassword),
                ]);
                console.log('✅ Initial Super Admin created from environment configuration.');
            } else {
                console.warn('⚠️ No initial admin was created. Set INITIAL_ADMIN_PASSWORD and an email or phone before first deployment.');
            }
        }
    } catch (err) {
        console.error('⚠️ Database auto-initialization notice:', err.message);
    }
}

module.exports = autoInitDatabase;
