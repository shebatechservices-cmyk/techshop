const pool = require('../../config/db');

let tableEnsured = false;

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

module.exports = {
    ensureExpenseCategoriesTable,
};
