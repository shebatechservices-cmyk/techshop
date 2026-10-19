const pool = require('../../config/db');
const { ensureUomTable } = require('./uomSchema');

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

        // If name changed, sync products table
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
