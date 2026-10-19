const pool = require('../../config/db');

let tableEnsured = false;

/**
 * Ensure units_of_measurement table exists with all required columns and default seeds
 */
async function ensureUomTable() {
    if (tableEnsured) return;
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS units_of_measurement (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                code VARCHAR(50),
                is_fractional_allowed BOOLEAN DEFAULT false,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_uom_is_active ON units_of_measurement(is_active);
        `);

        // Seed essential default units if table is empty
        const countRes = await pool.query('SELECT COUNT(*) FROM units_of_measurement');
        if (parseInt(countRes?.rows?.[0]?.count || 0, 10) === 0) {
            await pool.query(`
                INSERT INTO units_of_measurement (name, code, is_fractional_allowed, is_active)
                SELECT name, code, is_fractional_allowed, is_active FROM (
                    VALUES 
                    ('Piece', 'PCS', false, true),
                    ('Box', 'BOX', false, true),
                    ('Meter', 'MTR', true, true),
                    ('Drum / Spool', 'DRM', true, true),
                    ('Roll', 'ROLL', true, true),
                    ('Carton', 'CTN', false, true),
                    ('Pack', 'PK', false, true),
                    ('Set', 'SET', false, true),
                    ('Kilogram', 'KG', true, true),
                    ('Foot', 'FT', true, true)
                ) AS defaults(name, code, is_fractional_allowed, is_active)
                WHERE NOT EXISTS (SELECT 1 FROM units_of_measurement);
            `);
        }
        tableEnsured = true;
    } catch (err) {
        console.error('ensureUomTable error:', err.message);
    }
}

ensureUomTable().catch(() => null);

module.exports = {
    ensureUomTable
};
