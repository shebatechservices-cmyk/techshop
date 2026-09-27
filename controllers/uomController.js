const pool = require('../config/db');

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

/**
 * GET /api/uom
 * Fetch all Units of Measurement
 */
exports.getAllUom = async (req, res) => {
    try {
        await ensureUomTable();
        const { active_only, fractional_only } = req.query;

        let query = 'SELECT id, name, code, is_fractional_allowed, is_active, created_at, updated_at FROM units_of_measurement';
        const conditions = [];
        const params = [];

        if (active_only === 'true' || active_only === '1') {
            conditions.push('is_active = true');
        }

        if (fractional_only === 'true' || fractional_only === '1') {
            conditions.push('is_fractional_allowed = true');
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY id ASC';

        const result = await pool.query(query, params);

        return res.status(200).json({
            success: true,
            data: result.rows.map(r => ({
                id: r.id,
                name: r.name,
                code: r.code || '',
                is_fractional_allowed: Boolean(r.is_fractional_allowed),
                is_active: Boolean(r.is_active),
                created_at: r.created_at,
                updated_at: r.updated_at
            })),
            count: result.rows.length
        });
    } catch (error) {
        console.error('getAllUom error:', error);
        return res.status(500).json({
            success: false,
            message: 'পরিমাপের একক (UOM) লোড করতে ব্যর্থ হয়েছে।',
            error: error.message
        });
    }
};

/**
 * GET /api/uom/:id
 * Fetch single Unit of Measurement by ID
 */
exports.getUomById = async (req, res) => {
    try {
        await ensureUomTable();
        const { id } = req.params;
        const result = await pool.query(
            'SELECT id, name, code, is_fractional_allowed, is_active, created_at, updated_at FROM units_of_measurement WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'একক পাওয়া যায়নি।' });
        }

        const r = result.rows[0];
        return res.status(200).json({
            success: true,
            data: {
                id: r.id,
                name: r.name,
                code: r.code || '',
                is_fractional_allowed: Boolean(r.is_fractional_allowed),
                is_active: Boolean(r.is_active),
                created_at: r.created_at,
                updated_at: r.updated_at
            }
        });
    } catch (error) {
        console.error('getUomById error:', error);
        return res.status(500).json({ success: false, message: 'সার্ভার ত্রুটি।', error: error.message });
    }
};

/**
 * POST /api/uom
 * Create a new Unit of Measurement
 */
exports.createUom = async (req, res) => {
    try {
        await ensureUomTable();
        const { name, code, is_fractional_allowed, is_active } = req.body;

        if (!name || !String(name).trim()) {
            return res.status(400).json({
                success: false,
                message: 'এককের নাম (Unit Name) আবশ্যক।'
            });
        }

        const trimmedName = String(name).trim();
        const trimmedCode = code ? String(code).trim().toUpperCase() : trimmedName.slice(0, 4).toUpperCase();
        const fractionalAllowed = Boolean(is_fractional_allowed);
        const active = is_active !== undefined ? Boolean(is_active) : true;

        // Check if name already exists (case-insensitive)
        const dupCheck = await pool.query(
            'SELECT id, name FROM units_of_measurement WHERE LOWER(TRIM(name)) = LOWER($1) LIMIT 1',
            [trimmedName]
        );

        if (dupCheck.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: `"${trimmedName}" নামের একক ইতোমধ্যে বিদ্যমান রয়েছে।`
            });
        }

        const result = await pool.query(`
            INSERT INTO units_of_measurement (name, code, is_fractional_allowed, is_active, created_at, updated_at)
            VALUES ($1, $2, $3, $4, NOW(), NOW())
            RETURNING id, name, code, is_fractional_allowed, is_active, created_at, updated_at;
        `, [trimmedName, trimmedCode, fractionalAllowed, active]);

        const created = result.rows[0];
        return res.status(201).json({
            success: true,
            message: `পরিমাপের একক "${created.name}" সফলভাবে যুক্ত হয়েছে।`,
            data: {
                id: created.id,
                name: created.name,
                code: created.code || '',
                is_fractional_allowed: Boolean(created.is_fractional_allowed),
                is_active: Boolean(created.is_active),
                created_at: created.created_at,
                updated_at: created.updated_at
            }
        });
    } catch (error) {
        console.error('createUom error:', error);
        return res.status(500).json({
            success: false,
            message: 'একক তৈরি করতে সমস্যা হয়েছে।',
            error: error.message
        });
    }
};

/**
 * PUT /api/uom/:id
 * Update an existing Unit of Measurement
 */
exports.updateUom = async (req, res) => {
    try {
        await ensureUomTable();
        const { id } = req.params;
        const { name, code, is_fractional_allowed, is_active } = req.body;

        const existing = await pool.query('SELECT * FROM units_of_measurement WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'একক পাওয়া যায়নি।' });
        }

        const oldUom = existing.rows[0];
        const updates = [];
        const values = [];
        let pIndex = 1;

        if (name !== undefined) {
            const trimmedName = String(name).trim();
            if (!trimmedName) {
                return res.status(400).json({ success: false, message: 'এককের নাম ফাঁকা হতে পারে না।' });
            }

            // Duplicate check
            const dupCheck = await pool.query(
                'SELECT id FROM units_of_measurement WHERE LOWER(TRIM(name)) = LOWER($1) AND id != $2 LIMIT 1',
                [trimmedName, id]
            );
            if (dupCheck.rows.length > 0) {
                return res.status(409).json({ success: false, message: 'এই নামের আরেকটি একক ইতোমধ্যে বিদ্যমান।' });
            }

            updates.push(`name = $${pIndex++}`);
            values.push(trimmedName);
        }

        if (code !== undefined) {
            updates.push(`code = $${pIndex++}`);
            values.push(code ? String(code).trim().toUpperCase() : null);
        }

        if (is_fractional_allowed !== undefined) {
            updates.push(`is_fractional_allowed = $${pIndex++}`);
            values.push(Boolean(is_fractional_allowed));
        }

        if (is_active !== undefined) {
            updates.push(`is_active = $${pIndex++}`);
            values.push(Boolean(is_active));
        }

        updates.push(`updated_at = NOW()`);
        values.push(id);

        const updateQuery = `
            UPDATE units_of_measurement 
            SET ${updates.join(', ')}
            WHERE id = $${pIndex}
            RETURNING id, name, code, is_fractional_allowed, is_active, created_at, updated_at;
        `;

        const result = await pool.query(updateQuery, values);
        const updated = result.rows[0];

        // If name changed, optionally sync products table
        if (name && String(name).trim() !== oldUom.name) {
            await pool.query(
                'UPDATE products SET unit_name = $1 WHERE unit_name = $2',
                [updated.name, oldUom.name]
            ).catch(() => null);
            await pool.query(
                'UPDATE products SET sub_unit_name = $1 WHERE sub_unit_name = $2',
                [updated.name, oldUom.name]
            ).catch(() => null);
        }

        return res.status(200).json({
            success: true,
            message: `পরিমাপের একক "${updated.name}" সফলভাবে আপডেট করা হয়েছে।`,
            data: {
                id: updated.id,
                name: updated.name,
                code: updated.code || '',
                is_fractional_allowed: Boolean(updated.is_fractional_allowed),
                is_active: Boolean(updated.is_active),
                created_at: updated.created_at,
                updated_at: updated.updated_at
            }
        });
    } catch (error) {
        console.error('updateUom error:', error);
        return res.status(500).json({
            success: false,
            message: 'একক আপডেট করতে সমস্যা হয়েছে।',
            error: error.message
        });
    }
};

/**
 * DELETE /api/uom/:id
 * Delete a Unit of Measurement (with usage safety verification)
 */
exports.deleteUom = async (req, res) => {
    try {
        await ensureUomTable();
        const { id } = req.params;

        const existing = await pool.query('SELECT * FROM units_of_measurement WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'একক পাওয়া যায়নি।' });
        }

        const uom = existing.rows[0];

        // Safety check: is this unit used in products table?
        const usageRes = await pool.query(
            'SELECT COUNT(*) FROM products WHERE unit_name = $1 OR sub_unit_name = $1',
            [uom.name]
        );
        const inUseCount = parseInt(usageRes.rows[0]?.count || 0, 10);

        if (inUseCount > 0) {
            return res.status(400).json({
                success: false,
                message: `"${uom.name}" এককটি ${inUseCount}টি পণ্যে ব্যবহৃত হচ্ছে, তাই সরাসরি মুছে ফেলা সম্ভব নয়। চাইলে এটি Inactive করে রাখতে পারেন।`,
                inUseCount
            });
        }

        await pool.query('DELETE FROM units_of_measurement WHERE id = $1', [id]);

        return res.status(200).json({
            success: true,
            message: `পরিমাপের একক "${uom.name}" সফলভাবে মুছে ফেলা হয়েছে।`,
            deletedId: id
        });
    } catch (error) {
        console.error('deleteUom error:', error);
        return res.status(500).json({
            success: false,
            message: 'একক মুছতে সমস্যা হয়েছে।',
            error: error.message
        });
    }
};

exports.ensureUomTable = ensureUomTable;
