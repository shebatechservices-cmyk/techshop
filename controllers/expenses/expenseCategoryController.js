const pool = require('../../config/db');
const { ensureExpenseTables } = require('./expenseQueryController');

// -------------------------------------------------------------
// ৫. খরচের ক্যাটাগরি তালিকা (Get Categories)
// -------------------------------------------------------------
exports.getCategories = async (req, res) => {
    try {
        await ensureExpenseTables();
        const result = await pool.query(`SELECT * FROM expense_categories ORDER BY id ASC;`);
        return res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error('getCategories error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// -------------------------------------------------------------
// ৬. নতুন খরচের ক্যাটাগরি তৈরি (Create Category)
// -------------------------------------------------------------
exports.createCategory = async (req, res) => {
    try {
        await ensureExpenseTables();
        const { name, description } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Category name is required.' });
        }

        const query = `
            INSERT INTO expense_categories (name, description) 
            VALUES ($1, $2) 
            ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
            RETURNING *;
        `;
        const result = await pool.query(query, [name.trim(), description || '']);

        return res.status(201).json({
            success: true,
            message: `Expense category "${name}" saved!`,
            data: result.rows[0]
        });
    } catch (err) {
        console.error('createCategory error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};
