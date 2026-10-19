const pool = require('../../config/db');
const { ensureExpenseCategoriesTable } = require('./expenseCategorySchema');

exports.getExpenseCategories = async (req, res) => {
    try {
        await ensureExpenseCategoriesTable();
        const result = await pool.query(`
            SELECT id, name, created_at 
            FROM expense_categories 
            ORDER BY id ASC;
        `);

        // If explicitly requested as raw array (e.g. ?format=array or ?raw=true)
        if (req.query.format === 'array' || req.query.raw === 'true') {
            return res.status(200).json(result.rows);
        }

        return res.status(200).json({
            success: true,
            data: result.rows,
            count: result.rows.length,
        });
    } catch (err) {
        console.error('getExpenseCategories error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve expense categories',
            error: err.message,
        });
    }
};
