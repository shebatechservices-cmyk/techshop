const pool = require('../config/db');

const defaultCategories = [
    'Tea & Entertainment (চা ও আপ্যায়ন)',
    'Technician Conveyance / TADA (যাতায়াত)',
    'Shop & Warehouse Rent (দোকান ভাড়া)',
    'Electricity & Internet (বিদ্যুৎ ও ওয়াইফাই বিল)',
    'Packaging & Printing (প্যাকেজিং ও স্টিকার)',
    'Staff Salaries & Allowance (বেতন ও অগ্রিম)',
    'Shop Tools & Maintenance (মেরামত ও টুলস)',
    'Office Stationery & Supplies (স্টেশনারি)',
    'Marketing & Promotion (বিজ্ঞাপন)',
    'Others / Miscellaneous (বিবিধ খরচ)'
];

async function seedExpenseCategories() {
    console.log('Seeding default expense categories...');
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS expense_categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(150) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            ALTER TABLE expense_categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        `);

        let insertedCount = 0;
        for (const name of defaultCategories) {
            const res = await pool.query(`
                INSERT INTO expense_categories (name, created_at)
                VALUES ($1, CURRENT_TIMESTAMP)
                ON CONFLICT (name) DO NOTHING
                RETURNING id, name;
            `, [name]);

            if (res.rows.length > 0) {
                console.log(`+ Added category: ${name}`);
                insertedCount++;
            }
        }

        const totalRes = await pool.query('SELECT id, name, created_at FROM expense_categories ORDER BY id ASC');
        console.log(`Seeding complete. Inserted ${insertedCount} new categories. Total active categories: ${totalRes.rows.length}`);
        return totalRes.rows;
    } catch (err) {
        console.error('Error seeding expense categories:', err);
        throw err;
    }
}

if (require.main === module) {
    seedExpenseCategories()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = { seedExpenseCategories, defaultCategories };
