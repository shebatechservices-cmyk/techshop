const pool = require('../../config/db');
const { ensureExpenseCategoriesTable } = require('./expenseCategorySchema');

exports.createExpenseCategory = async (req, res) => {
    try {
        await ensureExpenseCategoriesTable();
        const rawName = req.body.name || req.body.category_name || req.body.categoryName;
        const name = String(rawName || '').trim();

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Category name is required.',
                error: 'Category name is required.',
            });
        }

        const existing = await pool.query(
            'SELECT id, name, created_at FROM expense_categories WHERE LOWER(TRIM(name)) = LOWER($1) LIMIT 1',
            [name]
        );

        if (existing.rows.length > 0) {
            const cat = existing.rows[0];
            return res.status(200).json({
                success: true,
                message: `Expense category "${cat.name}" already exists!`,
                data: cat,
                id: cat.id,
                name: cat.name,
                created_at: cat.created_at,
            });
        }

        const result = await pool.query(
            `INSERT INTO expense_categories (name, created_at)
             VALUES ($1, CURRENT_TIMESTAMP)
             RETURNING id, name, created_at;`,
            [name]
        );

        const newCat = result.rows[0];
        return res.status(201).json({
            success: true,
            message: `Expense category "${newCat.name}" added successfully!`,
            data: newCat,
            id: newCat.id,
            name: newCat.name,
            created_at: newCat.created_at,
        });
    } catch (err) {
        if (err.code === '23505') {
            const existing = await pool.query(
                'SELECT id, name, created_at FROM expense_categories WHERE LOWER(TRIM(name)) = LOWER($1) LIMIT 1',
                [req.body.name ? req.body.name.trim() : '']
            ).catch(() => ({ rows: [] }));

            if (existing.rows.length > 0) {
                const cat = existing.rows[0];
                return res.status(200).json({
                    success: true,
                    message: `Expense category "${cat.name}" already exists!`,
                    data: cat,
                    id: cat.id,
                    name: cat.name,
                    created_at: cat.created_at,
                });
            }
        }

        console.error('createExpenseCategory error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to create expense category',
            error: err.message,
        });
    }
};

exports.updateExpenseCategory = async (req, res) => {
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

        const rawName = req.body.name || req.body.category_name || req.body.categoryName;
        const name = String(rawName || '').trim();
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Category name is required.',
                error: 'Category name is required.',
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

        const oldCategory = catRes.rows[0];

        const dupCheck = await pool.query(
            'SELECT id FROM expense_categories WHERE LOWER(TRIM(name)) = LOWER($1) AND id != $2 LIMIT 1',
            [name, id]
        );
        if (dupCheck.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Another category with this name already exists.',
                error: 'Another category with this name already exists.',
            });
        }

        const updateRes = await pool.query(
            `UPDATE expense_categories 
             SET name = $1 
             WHERE id = $2 
             RETURNING id, name, created_at;`,
            [name, id]
        );

        await pool.query(
            'UPDATE expenses SET category_name = $1 WHERE category_id = $2 OR category_name = $3',
            [name, id, oldCategory.name]
        ).catch(() => null);

        const updatedCat = updateRes.rows[0];
        return res.status(200).json({
            success: true,
            message: `Expense category updated to "${updatedCat.name}"!`,
            data: updatedCat,
            id: updatedCat.id,
            name: updatedCat.name,
            created_at: updatedCat.created_at,
        });
    } catch (err) {
        console.error('updateExpenseCategory error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to update expense category',
            error: err.message,
        });
    }
};
