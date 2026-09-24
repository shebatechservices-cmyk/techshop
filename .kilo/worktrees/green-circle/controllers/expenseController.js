const pool = require('../config/db');

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

// -------------------------------------------------------------
// ৩. নতুন খরচ এন্ট্রি ও ব্যালেন্স সমন্বয় (Create Expense)
// -------------------------------------------------------------
exports.createExpense = async (req, res) => {
    const client = await pool.connect();
    try {
        await ensureExpenseTables();
        const {
            category_id,
            category_name,
            account_id,
            account_name,
            amount,
            expense_date,
            payee_name,
            reference_no,
            note,
            created_by
        } = req.body;

        const numAmount = parseFloat(amount);
        if (!numAmount || numAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Please enter a valid expense amount.' });
        }

        await client.query('BEGIN');

        // Resolve created_by user ID safely
        let validUserId = null;
        if (created_by) {
            const uCheck = await client.query('SELECT id FROM users WHERE id = $1', [created_by]);
            if (uCheck.rows.length > 0) validUserId = uCheck.rows[0].id;
        }
        if (!validUserId) {
            const firstU = await client.query('SELECT id FROM users ORDER BY id ASC LIMIT 1');
            if (firstU.rows.length > 0) validUserId = firstU.rows[0].id;
        }

        // Generate unique voucher number: e.g. EXP-2026-0819
        const voucher_no = 'EXP-' + new Date().getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 9000));

        // 1. Insert into expenses
        const insertSql = `
            INSERT INTO expenses 
            (voucher_no, category_id, category_name, account_id, account_name, amount, expense_date, payee_name, reference_no, note, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *;
        `;
        const insertValues = [
            voucher_no,
            category_id || null,
            category_name || 'General Expense',
            account_id || null,
            account_name || 'Cash in Hand (Counter Drawer)',
            numAmount,
            expense_date || new Date().toISOString().split('T')[0],
            payee_name || 'General',
            reference_no || '',
            note || '',
            validUserId
        ];
        const expResult = await client.query(insertSql, insertValues);

        // 2. Deduct from selected account if provided
        if (account_id) {
            await client.query(
                `UPDATE payment_accounts SET balance = balance - $1 WHERE id = $2;`,
                [numAmount, account_id]
            );

            // 3. Insert transaction into account_transactions ledger
            await client.query(`
                INSERT INTO account_transactions 
                (account_id, type, amount, reference, note, created_at)
                VALUES ($1, 'expense', $2, $3, $4, NOW());
            `, [
                account_id,
                numAmount,
                voucher_no,
                `Expense: ${category_name || 'General'} to ${payee_name || 'N/A'}`
            ]);
        }

        await client.query('COMMIT');

        // Audit Log
        await pool.query(`
            INSERT INTO audit_logs (user_id, action, table_name, record_id, new_data, severity)
            VALUES ($1, 'RECORD_EXPENSE', 'expenses', $2, $3, 'INFO');
        `, [
            validUserId,
            expResult.rows[0].id,
            JSON.stringify({ voucher_no, amount: numAmount, category: category_name })
        ]).catch(() => null);

        return res.status(201).json({
            success: true,
            message: `Expense ${voucher_no} of ৳ ${numAmount.toLocaleString()} recorded successfully!`,
            data: expResult.rows[0]
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('createExpense error:', err);
        return res.status(500).json({ success: false, message: err.message });
    } finally {
        client.release();
    }
};

// -------------------------------------------------------------
// ৪. খরচ বাতিল ও অ্যাকাউন্ট ব্যালেন্স রিভার্স (Delete Expense)
// -------------------------------------------------------------
exports.deleteExpense = async (req, res) => {
    const client = await pool.connect();
    try {
        await ensureExpenseTables();
        const { id } = req.params;

        await client.query('BEGIN');

        const checkRes = await client.query(`SELECT * FROM expenses WHERE id = $1;`, [id]);
        if (checkRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Expense record not found.' });
        }

        const exp = checkRes.rows[0];

        // Restore balance to account
        if (exp.account_id && exp.amount) {
            await client.query(`
                UPDATE payment_accounts 
                SET balance = balance + $1 
                WHERE id = $2;
            `, [parseFloat(exp.amount), exp.account_id]);

            // Reversal ledger: money returns to the account (inflow)
            await client.query(`
                INSERT INTO account_transactions (account_id, type, amount, reference, note, created_at)
                VALUES ($1, 'deposit', $2, $3, $4, NOW());
            `, [exp.account_id, parseFloat(exp.amount), exp.voucher_no || `EXP-${id}`,
                `Expense deleted (${exp.voucher_no || id}) — amount restored to account`]);
        }

        // Soft delete expense into Global Trash
        await client.query(`UPDATE expenses SET deleted_at = NOW() WHERE id = $1;`, [id]);
        await client.query(`
            INSERT INTO trash_records (table_name, record_id, record_title, record_data, deleted_at)
            VALUES ('expenses', $1, $2, $3, NOW())
        `, [id, exp.voucher_no || `EXP-${id}`, JSON.stringify(exp)]).catch(() => null);

        await client.query('COMMIT');

        return res.status(200).json({
            success: true,
            message: `Expense ${exp.voucher_no || id} moved to Trash and ৳ ${parseFloat(exp.amount).toLocaleString()} restored to account.`
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('deleteExpense error:', err);
        return res.status(500).json({ success: false, message: err.message });
    } finally {
        client.release();
    }
};

// -------------------------------------------------------------
// Update Expense (Edit Expense & Rebalance Accounts)
// -------------------------------------------------------------
exports.updateExpense = async (req, res) => {
    const client = await pool.connect();
    try {
        await ensureExpenseTables();
        const { id } = req.params;
        const {
            category_id,
            category_name,
            account_id,
            account_name,
            amount,
            expense_date,
            payee_name,
            reference_no,
            note
        } = req.body;

        await client.query('BEGIN');

        const existingRes = await client.query('SELECT * FROM expenses WHERE id = $1', [id]);
        if (!existingRes.rows.length) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Expense record not found.' });
        }
        const oldExp = existingRes.rows[0];
        const oldAmount = parseFloat(oldExp.amount || 0);
        const oldAccountId = oldExp.account_id;

        const newAmount = amount !== undefined ? parseFloat(amount) : oldAmount;
        if (isNaN(newAmount) || newAmount <= 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'Please enter a valid expense amount.' });
        }

        const effectiveAccountId = account_id !== undefined ? account_id : oldAccountId;

        // Balance synchronization + double-entry ledger rows:
        // Case 1: Same account, amount changed
        if (oldAccountId && effectiveAccountId && oldAccountId === effectiveAccountId) {
            const diff = newAmount - oldAmount;
            if (diff !== 0) {
                await client.query(
                    'UPDATE payment_accounts SET balance = balance - $1 WHERE id = $2',
                    [diff, effectiveAccountId]
                );
                await client.query(`
                    INSERT INTO account_transactions (account_id, type, amount, reference, note, created_at)
                    VALUES ($1, $2, $3, $4, $5, NOW())
                `, [effectiveAccountId, diff > 0 ? 'expense' : 'deposit', Math.abs(diff),
                    oldExp.voucher_no || `EXP-${id}`,
                    `Expense ${oldExp.voucher_no || id} edited: amount changed by ৳${Math.abs(diff).toLocaleString()}`]);
            }
        } else {
            // Case 2: Account changed
            if (oldAccountId) {
                await client.query(
                    'UPDATE payment_accounts SET balance = balance + $1 WHERE id = $2',
                    [oldAmount, oldAccountId]
                );
                await client.query(`
                    INSERT INTO account_transactions (account_id, type, amount, reference, note, created_at)
                    VALUES ($1, 'deposit', $2, $3, $4, NOW())
                `, [oldAccountId, oldAmount, oldExp.voucher_no || `EXP-${id}`,
                    `Expense ${oldExp.voucher_no || id} edited: account changed — ৳${oldAmount.toLocaleString()} restored`]);
            }
            if (effectiveAccountId) {
                await client.query(
                    'UPDATE payment_accounts SET balance = balance - $1 WHERE id = $2',
                    [newAmount, effectiveAccountId]
                );
                await client.query(`
                    INSERT INTO account_transactions (account_id, type, amount, reference, note, created_at)
                    VALUES ($1, 'expense', $2, $3, $4, NOW())
                `, [effectiveAccountId, newAmount, oldExp.voucher_no || `EXP-${id}`,
                    `Expense ${oldExp.voucher_no || id} edited: ৳${newAmount.toLocaleString()} debited from account`]);
            }
        }

        const updateFields = [];
        const updateParams = [];
        let pIdx = 1;

        if (category_id !== undefined) { updateFields.push(`category_id = $${pIdx++}`); updateParams.push(category_id || null); }
        if (category_name !== undefined) { updateFields.push(`category_name = $${pIdx++}`); updateParams.push(category_name); }
        if (account_id !== undefined) { updateFields.push(`account_id = $${pIdx++}`); updateParams.push(account_id || null); }
        if (account_name !== undefined) { updateFields.push(`account_name = $${pIdx++}`); updateParams.push(account_name); }
        if (amount !== undefined) { updateFields.push(`amount = $${pIdx++}`); updateParams.push(newAmount); }
        if (expense_date !== undefined) { updateFields.push(`expense_date = $${pIdx++}`); updateParams.push(expense_date); }
        if (payee_name !== undefined) { updateFields.push(`payee_name = $${pIdx++}`); updateParams.push(payee_name); }
        if (reference_no !== undefined) { updateFields.push(`reference_no = $${pIdx++}`); updateParams.push(reference_no); }
        if (note !== undefined) { updateFields.push(`note = $${pIdx++}`); updateParams.push(note); }

        if (updateFields.length > 0) {
            updateParams.push(id);
            await client.query(
                `UPDATE expenses SET ${updateFields.join(', ')} WHERE id = $${pIdx}`,
                updateParams
            );
        }

        const updatedResult = await client.query('SELECT * FROM expenses WHERE id = $1', [id]);

        await client.query('COMMIT');

        return res.status(200).json({
            success: true,
            message: `Expense ${oldExp.voucher_no || id} updated successfully!`,
            data: updatedResult.rows[0]
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('updateExpense error:', err);
        return res.status(500).json({ success: false, message: err.message });
    } finally {
        client.release();
    }
};

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
