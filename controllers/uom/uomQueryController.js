const pool = require('../../config/db');
const { ensureUomTable } = require('./uomSchema');

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
