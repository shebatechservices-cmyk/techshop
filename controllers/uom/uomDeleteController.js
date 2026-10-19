const pool = require('../../config/db');
const { ensureUomTable } = require('./uomSchema');

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
