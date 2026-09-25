const pool = require('../config/db');
const { hashPassword } = require('../config/auth');

async function seedAdmin() {
    console.log('Seeding default roles, settings, and admin account...');
    try {
        // 1. Ensure Roles Exist
        await pool.query(`
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
            INSERT INTO shop_settings (
                id, shop_name, shop_title, phone, email, address, 
                currency_symbol, license_key, license_status, client_app_id
            )
            VALUES (
                1, 'Sheba Technology', 'Smart POS & ERP System', '+8801700000000', 
                'support@sheba.technology', 'Dhaka, Bangladesh', '৳', 
                'SHEBA-ENT-2026-X99-PRO', 'Active Lifetime Enterprise', 'CLIENT-SHEBA-TECH-8801'
            )
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
