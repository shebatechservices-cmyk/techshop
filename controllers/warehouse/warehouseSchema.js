const pool = require('../../config/db');

let tableEnsured = false;

/**
 * Ensure the warehouses table and schema exists with all required fields
 */
async function ensureWarehousesTable() {
    if (tableEnsured) return;
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS warehouses (
                id SERIAL PRIMARY KEY,
                name VARCHAR(150) NOT NULL UNIQUE,
                code VARCHAR(50) UNIQUE,
                location TEXT,
                address TEXT,
                contact_person VARCHAR(100),
                phone VARCHAR(50),
                is_default BOOLEAN DEFAULT false,
                is_active BOOLEAN DEFAULT true,
                deleted_at TIMESTAMPTZ DEFAULT NULL,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );

            ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS code VARCHAR(50);
            ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS location TEXT;
            ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS address TEXT;
            ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS contact_person VARCHAR(100);
            ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
            ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
            ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
            ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
            ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
            ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
        `);

        // Check if any warehouses exist; if not, seed default starter warehouses
        const countRes = await pool.query('SELECT COUNT(*) FROM warehouses WHERE deleted_at IS NULL');
        if (parseInt(countRes.rows[0].count, 10) === 0) {
            await pool.query(`
                INSERT INTO warehouses (name, code, location, address, contact_person, phone, is_default, is_active)
                VALUES 
                    ('Main Shop / Head Office', 'WH-MAIN', 'Dhaka Central', 'Motijheel, Dhaka', 'Store Manager', '01700000000', true, true),
                    ('Central Godown', 'WH-GODOWN', 'Tejgaon Industrial Area', 'Tejgaon, Dhaka', 'Warehouse Officer', '01800000000', false, true),
                    ('Service & Warranty Center', 'WH-SERVICE', 'Dhanmondi Branch', 'Dhanmondi, Dhaka', 'Service Lead', '01900000000', false, true)
                ON CONFLICT (name) DO NOTHING;
            `);
        }

        tableEnsured = true;
    } catch (err) {
        console.error('ensureWarehousesTable error:', err.message);
    }
}

// Ensure schema on boot
ensureWarehousesTable().catch(() => null);

module.exports = {
    ensureWarehousesTable
};
