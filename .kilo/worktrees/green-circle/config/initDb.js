const fs = require('fs');
const path = require('path');
const pool = require('./db');
const { hashPassword } = require('./auth');

async function autoInitDatabase() {
    try {
        const checkRes = await pool.query("SELECT to_regclass('public.users')");
        if (checkRes.rows[0].to_regclass) {
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

                INSERT INTO payment_accounts (id, name, account_type, balance) VALUES
                (1, 'Drawer (ক্যাশ ড্রয়ার)', 'drawer', 0.00),
                (2, 'Main Bank Account', 'bank', 0.00)
                ON CONFLICT (id) DO NOTHING;
            `);
            console.log('✅ Essential default roles and cash accounts created.');

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
