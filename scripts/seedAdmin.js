const pool = require('../config/db');
const { hashPassword } = require('../config/auth');

async function seedAdmin() {
    console.log('Seeding default roles, settings, and admin account...');
    try {
        // 1. Ensure Roles Exist
        await pool.query(`
            CREATE TABLE IF NOT EXISTS roles (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                permissions JSONB DEFAULT '[]',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
            INSERT INTO roles (id, name, permissions) VALUES 
            (1, 'Super Admin', '[]'),
            (2, 'Admin', '[]'),
            (3, 'Staff', '[]'),
            (4, 'Online Technician', '[]')
            ON CONFLICT (id) DO NOTHING;
        `);
        console.log('✅ Default roles verified (Super Admin, Admin, Staff, Online Technician).');

        // 2. Ensure Shop Settings Exist
        await pool.query(`
            CREATE TABLE IF NOT EXISTS shop_settings (
                id SERIAL PRIMARY KEY,
                shop_name VARCHAR(255) DEFAULT 'Sheba Technology',
                tagline VARCHAR(255) DEFAULT 'Smart POS & ERP System',
                phone VARCHAR(50) DEFAULT '+8801700000000',
                email VARCHAR(100) DEFAULT 'support@sheba.technology',
                address TEXT DEFAULT 'Dhaka, Bangladesh',
                currency_symbol VARCHAR(10) DEFAULT '৳',
                license_key VARCHAR(150) DEFAULT 'SHEBA-ENT-2026-X99-PRO',
                license_status VARCHAR(50) DEFAULT 'active',
                client_app_id VARCHAR(100) DEFAULT 'CLIENT-SHEBA-TECH-8801',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
            INSERT INTO shop_settings (id, shop_name, tagline, currency_symbol, license_key, license_status)
            VALUES (1, 'Sheba Technology', 'Smart POS & ERP System', '৳', 'SHEBA-ENT-2026-X99-PRO', 'active')
            ON CONFLICT (id) DO NOTHING;
        `);
        console.log('✅ Shop settings initialized.');

        // 3. Ensure Default Admin Account Exists
        const initialEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@sheba.technology';
        const initialPhone = process.env.INITIAL_ADMIN_PHONE || '01700000000';
        const initialPassword = process.env.INITIAL_ADMIN_PASSWORD || 'admin123';
        const initialName = process.env.INITIAL_ADMIN_NAME || 'Super Admin';

        const existingAdmin = await pool.query('SELECT id, name, email, phone FROM users WHERE role_id = 1 LIMIT 1');

        if (existingAdmin.rows.length === 0) {
            const passwordHash = await hashPassword(initialPassword);
            const userRes = await pool.query(`
                INSERT INTO users (name, email, phone, password_hash, role_id, role_name, is_active, approval_status)
                VALUES ($1, $2, $3, $4, 1, 'Super Admin', true, 'approved')
                RETURNING id, name, email, phone;
            `, [initialName, initialEmail, initialPhone, passwordHash]);

            console.log(`✅ Default Super Admin account created:`, {
                id: userRes.rows[0].id,
                name: userRes.rows[0].name,
                email: userRes.rows[0].email,
                phone: userRes.rows[0].phone,
                defaultPassword: initialPassword
            });
        } else {
            console.log(`ℹ️ Super Admin account already exists (ID: ${existingAdmin.rows[0].id}, Name: ${existingAdmin.rows[0].name}).`);
        }

        console.log('🎉 Seeding completed successfully!');
    } catch (err) {
        console.error('❌ Error during admin seeding:', err);
        throw err;
    }
}

if (require.main === module) {
    seedAdmin()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = { seedAdmin };
