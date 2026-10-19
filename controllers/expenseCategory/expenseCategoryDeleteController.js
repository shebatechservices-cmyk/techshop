const pool = require('../../config/db');
const { ensureExpenseCategoriesTable } = require('./expenseCategorySchema');

exports.deleteExpenseCategory = async (req, res) => {
    try {
        await ensureExpenseCategoriesTable();
        const id = parseInt(req.params.id, 10);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category ID.',
                error: 'Invalid category ID.',
            });
        }

        const catRes = await pool.query('SELECT * FROM expense_categories WHERE id = $1', [id]);
        if (catRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Expense category not found.',
                error: 'Expense category not found.',
            });
        }

        const category = catRes.rows[0];

        const usageRes = await pool.query(
            'SELECT COUNT(*) FROM expenses WHERE category_id = $1 OR category_name = $2',
            [id, category.name]
        );
        const inUseCount = parseInt(usageRes.rows[0].count, 10);

        if (inUseCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete category: Existing expense records are using it',
                error: 'Cannot delete category: Existing expense records are using it',
                inUseCount,
            });
        }

        await pool.query('DELETE FROM expense_categories WHERE id = $1', [id]);

        return res.status(200).json({
            success: true,
            message: `Expense category "${category.name}" deleted successfully!`,
            deletedId: id,
        });
    } catch (err) {
        console.error('deleteExpenseCategory error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete expense category',
            error: err.message,
        });
    }
};
