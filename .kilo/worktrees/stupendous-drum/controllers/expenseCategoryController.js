const pool = require('../config/db');

let tableEnsured = false;

/**
 * Ensure expense_categories table exists with columns: id, name, created_at
 */
async function ensureExpenseCategoriesTable() {
    if (tableEnsured) return;
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS expense_categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(150) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            ALTER TABLE expense_categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        `);

        // If table is empty, seed initial starter categories
        const countRes = await pool.query('SELECT COUNT(*) FROM expense_categories');
        if (parseInt(countRes.rows[0].count, 10) === 0) {
            await pool.query(`
                INSERT INTO expense_categories (name) VALUES
                ('Tea & Entertainment (চা ও আপ্যায়ন)'),
                ('Technician Conveyance / TADA (যাতায়াত)'),
                ('Shop & Warehouse Rent (দোকান ভাড়া)'),
                ('Electricity & Internet (বিদ্যুৎ ও ওয়াইফাই বিল)'),
                ('Packaging & Printing (প্যাকেজিং ও স্টিকার)'),
                ('Staff Salaries & Allowance (বেতন ও অগ্রিম)'),
                ('Shop Tools & Maintenance (মেরামত ও টুলস)'),
                ('Others / Miscellaneous (বিবিধ খরচ)')
                ON CONFLICT (name) DO NOTHING;
            `);
        }

        tableEnsured = true;
    } catch (err) {
        console.error('ensureExpenseCategoriesTable error:', err.message);
    }
}

// Ensure on startup
ensureExpenseCategoriesTable().catch(() => null);

/**
 * GET /api/expense-categories
 * Fetch list of all expense categories
 */
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
            count: result.rows.length
        });
    } catch (err) {
        console.error('getExpenseCategories error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve expense categories',
            error: err.message
        });
    }
};

/**
 * POST /api/expense-categories
 * Add a new expense category
 */
exports.createExpenseCategory = async (req, res) => {
    try {
        await ensureExpenseCategoriesTable();
        const rawName = req.body.name || req.body.category_name || req.body.categoryName;
        const name = String(rawName || '').trim();

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Category name is required.',
                error: 'Category name is required.'
            });
        }

        // Check if category already exists (case-insensitive)
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
                created_at: cat.created_at
            });
        }

        // Insert new category
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
            created_at: newCat.created_at
        });
    } catch (err) {
        if (err.code === '23505') { // Unique violation
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
                    created_at: cat.created_at
                });
            }
        }

        console.error('createExpenseCategory error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to create expense category',
            error: err.message
        });
    }
};

/**
 * PUT /api/expense-categories/:id
 * Rename / update an expense category
 */
exports.updateExpenseCategory = async (req, res) => {
    try {
        await ensureExpenseCategoriesTable();
        const id = parseInt(req.params.id, 10);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category ID.',
                error: 'Invalid category ID.'
            });
        }

        const rawName = req.body.name || req.body.category_name || req.body.categoryName;
        const name = String(rawName || '').trim();
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Category name is required.',
                error: 'Category name is required.'
            });
        }

        // Check if category exists
        const catRes = await pool.query('SELECT * FROM expense_categories WHERE id = $1', [id]);
        if (catRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Expense category not found.',
                error: 'Expense category not found.'
            });
        }

        const oldCategory = catRes.rows[0];

        // Check if name is already taken by another category (case-insensitive)
        const dupCheck = await pool.query(
            'SELECT id FROM expense_categories WHERE LOWER(TRIM(name)) = LOWER($1) AND id != $2 LIMIT 1',
            [name, id]
        );
        if (dupCheck.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Another category with this name already exists.',
                error: 'Another category with this name already exists.'
            });
        }

        // Update category name
        const updateRes = await pool.query(
            `UPDATE expense_categories 
             SET name = $1 
             WHERE id = $2 
             RETURNING id, name, created_at;`,
            [name, id]
        );

        // Also synchronize expense records referencing this category
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
            created_at: updatedCat.created_at
        });
    } catch (err) {
        console.error('updateExpenseCategory error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to update expense category',
            error: err.message
        });
    }
};

/**
 * DELETE /api/expense-categories/:id
 * Delete an expense category with safety check preventing deletion if in use
 */
exports.deleteExpenseCategory = async (req, res) => {
    try {
        await ensureExpenseCategoriesTable();
        const id = parseInt(req.params.id, 10);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category ID.',
                error: 'Invalid category ID.'
            });
        }

        // Check if category exists
        const catRes = await pool.query('SELECT * FROM expense_categories WHERE id = $1', [id]);
        if (catRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Expense category not found.',
                error: 'Expense category not found.'
            });
        }

        const category = catRes.rows[0];

        // CRITICAL CHECK: Check if the category ID is currently being used in expenses table
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
                inUseCount
            });
        }

        // Safe to delete
        await pool.query('DELETE FROM expense_categories WHERE id = $1', [id]);

        return res.status(200).json({
            success: true,
            message: `Expense category "${category.name}" deleted successfully!`,
            deletedId: id
        });
    } catch (err) {
        console.error('deleteExpenseCategory error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete expense category',
            error: err.message
        });
    }
};

exports.ensureExpenseCategoriesTable = ensureExpenseCategoriesTable;
