const pool = require('../../config/db');

let tablesMigrated = false;

async function ensureExpenseTables() {
    if (tablesMigrated) return;
    try {
        await pool.query(`
            -- Expense Categories Table
            CREATE TABLE IF NOT EXISTS expense_categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                description TEXT,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW()
            );

            -- Expenses Table
            CREATE TABLE IF NOT EXISTS expenses (
                id SERIAL PRIMARY KEY,
                voucher_no VARCHAR(100) UNIQUE,
                category_id INT REFERENCES expense_categories(id) ON DELETE SET NULL,
                category_name VARCHAR(150),
                account_id INT REFERENCES payment_accounts(id) ON DELETE SET NULL,
                account_name VARCHAR(150),
                amount NUMERIC(14,2) NOT NULL,
                expense_date DATE DEFAULT CURRENT_DATE,
                payee_name VARCHAR(150),
                reference_no VARCHAR(100),
                note TEXT,
                created_by INT REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );

            -- Ensure columns in expenses table
            ALTER TABLE expenses ADD COLUMN IF NOT EXISTS voucher_no VARCHAR(100);
            ALTER TABLE expenses ADD COLUMN IF NOT EXISTS category_name VARCHAR(150);
            ALTER TABLE expenses ADD COLUMN IF NOT EXISTS account_name VARCHAR(150);
            ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payee_name VARCHAR(150);
            ALTER TABLE expenses ADD COLUMN IF NOT EXISTS reference_no VARCHAR(100);
            ALTER TABLE expenses ADD COLUMN IF NOT EXISTS note TEXT;
            ALTER TABLE expense_categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
            CREATE UNIQUE INDEX IF NOT EXISTS idx_expenses_voucher_no ON expenses (voucher_no);
        `);

        // Seed default categories if empty
        const catRes = await pool.query('SELECT COUNT(*) FROM expense_categories');
        if (parseInt(catRes.rows[0].count, 10) === 0) {
            await pool.query(`
                INSERT INTO expense_categories (name, description) VALUES
                ('Tea & Entertainment (চা ও আপ্যায়ন)', 'Daily tea, snacks, and customer entertainment'),
                ('Technician Conveyance / TADA (যাতায়াত)', 'Field technician motorcycle fuel, rickshaw, and travel'),
                ('Shop & Warehouse Rent (দোকান ভাড়া)', 'Monthly shop and warehouse lease'),
                ('Electricity & Internet (বিদ্যুৎ ও ওয়াইফাই বিল)', 'Utility, broadband internet, and generator bills'),
                ('Packaging & Printing (প্যাকেজিং ও স্টিকার)', 'Bubble wrap, boxes, warranty stickers, and stationery'),
                ('Staff Salaries & Allowance (বেতন ও অগ্রিম)', 'Monthly staff payroll, bonuses, and advance salary'),
                ('Shop Tools & Maintenance (মেরামত ও টুলস)', 'Drill bits, screwdrivers, shop lighting, and repairs'),
                ('Others / Miscellaneous (বিবিধ খরচ)', 'Other daily operational and unclassified expenses')
            `);
        }

        tablesMigrated = true;
    } catch (err) {
        console.error('Expense table migration notice:', err.message);
    }
}

// -------------------------------------------------------------
// ১. এক্সপেন্স ড্যাশবোর্ড ও অ্যানালিটিক্স ওভারভিউ
// -------------------------------------------------------------
exports.getOverview = async (req, res) => {
    try {
        await ensureExpenseTables();

        // 1. Today's Total
        const todayRes = await pool.query(`
            SELECT COALESCE(SUM(amount), 0) AS total_today, COUNT(*) AS count_today
            FROM expenses
            WHERE expense_date = CURRENT_DATE AND deleted_at IS NULL;
        `);

        // 2. This Month's Total
        const monthRes = await pool.query(`
            SELECT COALESCE(SUM(amount), 0) AS total_month, COUNT(*) AS count_month
            FROM expenses
            WHERE DATE_TRUNC('month', expense_date) = DATE_TRUNC('month', CURRENT_DATE) AND deleted_at IS NULL;
        `);

        // 3. Category Breakdown (This Month)
        const catBreakdownRes = await pool.query(`
            SELECT 
                COALESCE(category_name, 'Uncategorized') AS category_name,
                SUM(amount) AS total_amount,
                COUNT(*) AS count
            FROM expenses
            WHERE DATE_TRUNC('month', expense_date) = DATE_TRUNC('month', CURRENT_DATE) AND deleted_at IS NULL
            GROUP BY category_name
            ORDER BY total_amount DESC
            LIMIT 6;
        `);

        // 4. Cash vs Digital Outflow (This Month)
        const paymentSplitRes = await pool.query(`
            SELECT 
                CASE 
                    WHEN LOWER(account_name) LIKE '%cash%' OR LOWER(account_name) LIKE '%drawer%' THEN 'Cash'
                    ELSE 'Digital / Bank'
                END AS payment_type,
                SUM(amount) AS total_amount
            FROM expenses
            WHERE DATE_TRUNC('month', expense_date) = DATE_TRUNC('month', CURRENT_DATE) AND deleted_at IS NULL
            GROUP BY payment_type;
        `);

        return res.status(200).json({
            success: true,
            data: {
                total_today: parseFloat(todayRes.rows[0].total_today || 0),
                count_today: parseInt(todayRes.rows[0].count_today || 0, 10),
                total_month: parseFloat(monthRes.rows[0].total_month || 0),
                count_month: parseInt(monthRes.rows[0].count_month || 0, 10),
                category_breakdown: catBreakdownRes.rows,
                payment_split: paymentSplitRes.rows
            }
        });
    } catch (err) {
        console.error('getOverview error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// -------------------------------------------------------------
// ২. সমস্ত খরচের তালিকা ও ফিল্টারিং
// -------------------------------------------------------------
exports.getExpenses = async (req, res) => {
    try {
        await ensureExpenseTables();
        const { date_range, category, account_id, search, limit = 100 } = req.query;

        let conditions = ['e.deleted_at IS NULL'];
        let params = [];

        if (date_range === 'today') {
            conditions.push(`e.expense_date = CURRENT_DATE`);
        } else if (date_range === 'this_week') {
            conditions.push(`e.expense_date >= DATE_TRUNC('week', CURRENT_DATE)`);
        } else if (date_range === 'this_month') {
            conditions.push(`DATE_TRUNC('month', e.expense_date) = DATE_TRUNC('month', CURRENT_DATE)`);
        }

        if (category && category !== 'ALL') {
            params.push(category);
            conditions.push(`e.category_name = $${params.length}`);
        }

        if (account_id && account_id !== 'ALL') {
            params.push(account_id);
            conditions.push(`e.account_id = $${params.length}`);
        }

        if (search && search.trim()) {
            params.push(`%${search.trim().toLowerCase()}%`);
            conditions.push(`(
                LOWER(e.voucher_no) LIKE $${params.length} OR 
                LOWER(e.category_name) LIKE $${params.length} OR 
                LOWER(e.payee_name) LIKE $${params.length} OR 
                LOWER(e.reference_no) LIKE $${params.length} OR 
                LOWER(e.note) LIKE $${params.length} OR 
                LOWER(e.account_name) LIKE $${params.length}
            )`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const query = `
            SELECT e.* 
            FROM expenses e
            ${whereClause}
            ORDER BY e.expense_date DESC, e.id DESC
            LIMIT ${parseInt(limit, 10) || 100};
        `;

        const result = await pool.query(query, params);

        return res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error('getExpenses error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    ...exports,
    ensureExpenseTables
};
