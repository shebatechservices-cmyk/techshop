const pool = require('../config/db');

// Transaction ID column নিশ্চিত করা (MFS/Bank manual TrxID support)
const ensureAccountColumns = async () => {
    try {
        await pool.query(`ALTER TABLE account_transactions ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(120);`);
    } catch (e) {
        console.error('ensureAccountColumns error:', e.message);
    }
};

// নতুন অ্যাকাউন্ট বা ওয়ালেট তৈরি (Manual বা Auto)
exports.createAccount = async (req, res) => {
    try {
        const { name, account_type = 'wallet', balance = 0, account_number = '' } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'অ্যাকাউন্টের নাম দিন।' });

        const query = `
            INSERT INTO payment_accounts (name, account_type, balance, account_number) 
            VALUES ($1, $2, $3, NULLIF($4, '')) 
            RETURNING *;
        `;
        const result = await pool.query(query, [name, account_type, balance, account_number]);

        if (Number(balance) > 0) {
            await pool.query(`
                INSERT INTO account_transactions (account_id, type, amount, reference, note)
                VALUES ($1, 'deposit', $2, 'Opening Balance', 'Initial opening balance for new account')
            `, [result.rows[0].id, balance]);
        }
        
        return res.status(201).json({
            success: true,
            message: 'ডিজিটাল ওয়ালেট সফলভাবে তৈরি হয়েছে।',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Account creation error:', error);
        return res.status(500).json({ success: false, message: 'সার্ভার এরর হয়েছে।' });
    }
};

// সকল ওয়ালেট বা অ্যাকাউন্টের তালিকা এবং ব্যালেন্স দেখা
exports.getAccounts = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT a.*, name AS account_name,
                (SELECT COUNT(*) FROM account_transactions t WHERE t.account_id = a.id)::int AS tx_count,
                (SELECT COUNT(*) FROM purchase_order_payments p WHERE p.account_id = a.id)::int AS po_count,
                (SELECT COUNT(*) FROM expenses e WHERE e.account_id = a.id)::int AS expense_count
            FROM payment_accounts a
            ORDER BY a.id ASC;
        `);
        const rows = result.rows.map((r) => {
            const usage = Number(r.tx_count || 0) + Number(r.po_count || 0) + Number(r.expense_count || 0);
            return { ...r, usage_count: usage, has_history: usage > 0 };
        });
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('Get accounts error:', error);
        return res.status(500).json({ success: false, message: 'সার্ভার এরর হয়েছে।' });
    }
};


// ওয়ালেট / অ্যাকাউন্টের নাম বা ধরন আপডেট করা
exports.updateAccount = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { name, account_type, account_number } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'অ্যাকাউন্টের নাম দিন।' });
        }

        const accRes = await pool.query('SELECT * FROM payment_accounts WHERE id = $1 AND is_active = true', [id]);
        if (!accRes.rows.length) {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }

        const allowed = ['cash', 'drawer', 'bank', 'bkash', 'nagad', 'wallet', 'mfs', 'card', 'mobile', 'upi'];
        const rawType = String(account_type || accRes.rows[0].account_type || 'drawer').toLowerCase();
        const finalType = allowed.includes(rawType) ? rawType : 'drawer';

        const finalNumber = account_number === undefined ? accRes.rows[0].account_number : account_number;

        const result = await pool.query(
            'UPDATE payment_accounts SET name = $1, account_type = $2, account_number = NULLIF($3, \'\') WHERE id = $4 RETURNING *',
            [name.trim(), finalType, finalNumber || '', id]
        );

        return res.status(200).json({
            success: true,
            message: 'অ্যাকাউন্ট সফলভাবে আপডেট হয়েছে।',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('updateAccount error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};


// ওয়ালেটে ডিপোজিট বা টাকা জমা করা
exports.depositToAccount = async (req, res) => {
    const client = await pool.connect();
    try {
        const { account_id, amount, reference, note, transaction_id } = req.body;
        if (!account_id || !amount || Number(amount) <= 0) {
            return res.status(400).json({ success: false, message: 'সঠিক অ্যাকাউন্ট এবং অ্যামাউন্ট দিন।' });
        }

        await ensureAccountColumns();
        await client.query('BEGIN');

        // ১. একাউন্টের ব্যালেন্স আপডেট করা
        await client.query(`
            UPDATE payment_accounts 
            SET balance = balance + $1 
            WHERE id = $2
        `, [amount, account_id]);

        // ২. ট্রানজেকশন লেজারে এন্ট্রি করা
        await client.query(`
            INSERT INTO account_transactions (account_id, type, amount, reference, note, transaction_id)
            VALUES ($1, 'deposit', $2, $3, $4, $5)
        `, [account_id, amount, reference || 'Cash Deposit', note, transaction_id || null]);

        await client.query('COMMIT');

        return res.status(200).json({
            success: true,
            message: 'টাকা সফলভাবে জমা হয়েছে।'
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Deposit error:', error);
        return res.status(500).json({ success: false, message: 'সার্ভার এরর হয়েছে।' });
    } finally {
        client.release();
    }
};

// ওয়ালেট থেকে টাকা উত্তোলন (Withdraw)
exports.withdrawFromAccount = async (req, res) => {
    const client = await pool.connect();
    try {
        const { account_id, amount, reference, note, transaction_id } = req.body;
        if (!account_id || !amount || Number(amount) <= 0) {
            return res.status(400).json({ success: false, message: 'সঠিক অ্যাকাউন্ট এবং অ্যামাউন্ট দিন।' });
        }

        await ensureAccountColumns();
        await client.query('BEGIN');

        // ব্যালেন্স পর্যাপ্ত আছে কি না চেক করা
        const accCheck = await client.query('SELECT balance FROM payment_accounts WHERE id = $1', [account_id]);
        if (accCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'অ্যাকাউন্ট পাওয়া যায়নি।' });
        }

        const currentBalance = Number(accCheck.rows[0].balance);
        if (currentBalance < Number(amount)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই।' });
        }

        // ১. ব্যালেন্স কমানো
        await client.query(`
            UPDATE payment_accounts 
            SET balance = balance - $1 
            WHERE id = $2
        `, [amount, account_id]);

        // ২. লেজারে এন্ট্রি করা
        await client.query(`
            INSERT INTO account_transactions (account_id, type, amount, reference, note, transaction_id)
            VALUES ($1, 'withdraw', $2, $3, $4, $5)
        `, [account_id, amount, reference || 'Cash Withdraw', note, transaction_id || null]);

        await client.query('COMMIT');

        return res.status(200).json({
            success: true,
            message: 'টাকা সফলভাবে উত্তোলন করা হয়েছে।'
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Withdraw error:', error);
        return res.status(500).json({ success: false, message: 'সার্ভার এরর হয়েছে।' });
    } finally {
        client.release();
    }
};

// কাস্টমার বা সাপ্লায়ারের ডিউ (Due) পেমেন্ট ওয়ালেট থেকে পরিশোধ করা
exports.payDueViaWallet = async (req, res) => {
    const client = await pool.connect();
    try {
        const { account_id, party_type, party_id, amount, note } = req.body;
        // party_type হতে পারে 'customer' অথবা 'supplier'
        if (!account_id || !party_type || !party_id || !amount || Number(amount) <= 0) {
            return res.status(400).json({ success: false, message: 'সব তথ্য সঠিকভাবে প্রদান করুন।' });
        }

        await client.query('BEGIN');

        // ১. ওয়ালেটে পর্যাপ্ত ব্যালেন্স আছে কিনা চেক করা
        const accCheck = await client.query('SELECT balance FROM payment_accounts WHERE id = $1', [account_id]);
        if (accCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'ওয়ালেট পাওয়া যায়নি।' });
        }

        const currentBalance = Number(accCheck.rows[0].balance);
        if (party_type === 'supplier' && currentBalance < Number(amount)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'ওয়ালেটে পর্যাপ্ত টাকা নেই।' });
        }

        if (party_type === 'supplier') {
            // সাপ্লায়ারকে পেমেন্ট দিলে ওয়ালেট থেকে টাকা কমবে এবং সাপ্লায়ারের payable_balance কমবে
            await client.query('UPDATE payment_accounts SET balance = balance - $1 WHERE id = $2', [amount, account_id]);
            await client.query('UPDATE suppliers SET payable_balance = payable_balance - $1 WHERE id = $2', [amount, party_id]);
            
            await client.query(`
                INSERT INTO account_transactions (account_id, type, amount, reference, note)
                VALUES ($1, 'due_payment', $2, $3, $4)
            `, [account_id, amount, `Paid to Supplier ID: ${party_id}`, note]);

        } else if (party_type === 'customer') {
            // কাস্টমার পেমেন্ট দিলে (বকেয়া পরিশোধ করলে) ওয়ালেটে টাকা বাড়বে এবং receivable_balance কমবে
            await client.query('UPDATE payment_accounts SET balance = balance + $1 WHERE id = $2', [amount, account_id]);
            await client.query('UPDATE customers SET receivable_balance = receivable_balance - $1 WHERE id = $2', [amount, party_id]);
            
            await client.query(`
                INSERT INTO account_transactions (account_id, type, amount, reference, note)
                VALUES ($1, 'due_receive', $2, $3, $4)
            `, [account_id, amount, `Received from Customer ID: ${party_id}`, note]);
        }

        await client.query('COMMIT');

        return res.status(200).json({
            success: true,
            message: 'বকেয়া পরিশোধ সফলভাবে সম্পন্ন হয়েছে।'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Due payment error:', error);
        return res.status(500).json({ success: false, message: 'সার্ভার এরর হয়েছে।' });
    } finally {
        client.release();
    }
};

// ফান্ড ট্রান্সফার (এক ওয়ালেট থেকে অন্য ওয়ালেটে)
exports.transferFunds = async (req, res) => {
    const client = await pool.connect();
    try {
        const { from_wallet_id, to_wallet_id, amount, note, transaction_id } = req.body;
        const numAmount = Number(amount);
        if (!from_wallet_id || !to_wallet_id || !numAmount || numAmount <= 0) {
            return res.status(400).json({ success: false, message: 'সঠিক ওয়ালেট এবং অ্যামাউন্ট নির্বাচন করুন।' });
        }
        if (String(from_wallet_id) === String(to_wallet_id)) {
            return res.status(400).json({ success: false, message: 'একই ওয়ালেটে ট্রান্সফার সম্ভব নয়।' });
        }

        await ensureAccountColumns();
        await client.query('BEGIN');

        const sourceCheck = await client.query('SELECT balance, name FROM payment_accounts WHERE id = $1', [from_wallet_id]);
        if (sourceCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'উৎস ওয়ালেট পাওয়া যায়নি।' });
        }
        if (Number(sourceCheck.rows[0].balance) < numAmount) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'পর্যাপ্ত ব্যালেন্স নেই।' });
        }

        await client.query('UPDATE payment_accounts SET balance = balance - $1 WHERE id = $2', [numAmount, from_wallet_id]);
        await client.query('UPDATE payment_accounts SET balance = balance + $1 WHERE id = $2', [numAmount, to_wallet_id]);

        await client.query(`
            INSERT INTO account_transactions (account_id, type, amount, reference, note, transaction_id)
            VALUES ($1, 'transfer_out', $2, $3, $4, $5)
        `, [from_wallet_id, numAmount, `Transfer to #${to_wallet_id}`, note || '', transaction_id || null]);

        await client.query(`
            INSERT INTO account_transactions (account_id, type, amount, reference, note, transaction_id)
            VALUES ($1, 'transfer_in', $2, $3, $4, $5)
        `, [to_wallet_id, numAmount, `Transfer from #${from_wallet_id}`, note || '', transaction_id || null]);

        await client.query('COMMIT');
        return res.status(200).json({ success: true, message: 'ফান্ড ট্রান্সফার সফলভাবে সম্পন্ন হয়েছে।' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Transfer error:', error);
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};

// সকল ট্রানজেকশন তালিকা দেখা
exports.getTransactions = async (req, res) => {
    try {
        let result;
        try {
            result = await pool.query(`
                SELECT t.*, p.name AS account_name
                FROM account_transactions t
                LEFT JOIN payment_accounts p ON t.account_id = p.id
                ORDER BY t.id DESC LIMIT 100;
            `);
        } catch (e) {
            result = await pool.query(`
                SELECT t.*, p.name AS account_name
                FROM transactions t
                LEFT JOIN payment_accounts p ON t.account_id = p.id
                ORDER BY t.id DESC LIMIT 100;
            `);
        }
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        return res.status(200).json({ success: true, data: [] });
    }
};

// দৈনিক ক্যাশ ক্লোজিং সামারি (Z-Report)
exports.getDayCloseSummary = async (req, res) => {
    try {
        const targetDate = req.query.date || new Date().toISOString().split('T')[0];

        // 1. Current Account Balances (Cash Drawer, Bank, MFS)
        const accountsRes = await pool.query(`
            SELECT id, name, account_type, balance 
            FROM payment_accounts 
            ORDER BY id ASC;
        `);

        // 2. Today's Sales breakdown
        const salesRes = await pool.query(`
            SELECT 
                COUNT(*) AS total_invoices,
                COALESCE(SUM(total_amount), 0) AS gross_sales,
                COALESCE(SUM(paid_amount), 0) AS total_collected,
                COALESCE(SUM(due_amount), 0) AS total_due_given
            FROM sales
            WHERE DATE(created_at) = $1;
        `, [targetDate]);

        // 3. Today's Account Transactions breakdown
        const trxsRes = await pool.query(`
            SELECT 
                t.type,
                p.name AS account_name,
                p.id AS account_id,
                COALESCE(SUM(t.amount), 0) AS total_amount,
                COUNT(*) AS count
            FROM account_transactions t
            JOIN payment_accounts p ON p.id = t.account_id
            WHERE DATE(t.created_at) = $1
            GROUP BY t.type, p.name, p.id
            ORDER BY t.type;
        `, [targetDate]);

        // 4. Today's Purchases breakdown
        const purchaseRes = await pool.query(`
            SELECT 
                COUNT(*) AS total_pos,
                COALESCE(SUM(total_cost), 0) AS total_purchased,
                COALESCE(SUM(total_paid), 0) AS total_purchase_paid,
                COALESCE(SUM(total_due), 0) AS total_purchase_due
            FROM purchase_orders
            WHERE DATE(created_at) = $1;
        `, [targetDate]);

        // Calculate aggregate numbers
        let cashInflow = 0;
        let cashOutflow = 0;
        let bankMfsInflow = 0;
        let bankMfsOutflow = 0;
        let totalExpenses = 0;
        let totalDuesCollected = 0;
        let totalSupplierPaid = 0;

        trxsRes.rows.forEach(tr => {
            const amt = parseFloat(tr.total_amount || 0);
            const isCash = (tr.account_name || '').toLowerCase().includes('cash') || (tr.account_name || '').toLowerCase().includes('drawer');

            if (tr.type === 'deposit' || tr.type === 'due_receive' || tr.type === 'advance_receive' || tr.type === 'transfer_in') {
                if (isCash) cashInflow += amt;
                else bankMfsInflow += amt;
                if (tr.type === 'due_receive') totalDuesCollected += amt;
            } else if (tr.type === 'withdraw' || tr.type === 'due_payment' || tr.type === 'advance_payment' || tr.type === 'refund' || tr.type === 'expense' || tr.type === 'transfer_out' || tr.type === 'purchase_payment') {
                if (isCash) cashOutflow += amt;
                else bankMfsOutflow += amt;
                if (tr.type === 'due_payment' || tr.type === 'advance_payment') totalSupplierPaid += amt;
                if (tr.type === 'expense') totalExpenses += amt;
            }
        });

        const cashAccounts = accountsRes.rows.filter(a => 
            (a.name || '').toLowerCase().includes('cash') || (a.name || '').toLowerCase().includes('drawer')
        );
        const currentCashInDrawer = cashAccounts.reduce((sum, a) => sum + parseFloat(a.balance || 0), 0);

        return res.status(200).json({
            success: true,
            date: targetDate,
            sales: salesRes.rows[0],
            purchases: purchaseRes.rows[0],
            accounts: accountsRes.rows,
            summary: {
                current_cash_in_drawer: currentCashInDrawer,
                cash_inflow: cashInflow,
                cash_outflow: cashOutflow,
                net_cash_flow: cashInflow - cashOutflow,
                bank_mfs_inflow: bankMfsInflow,
                bank_mfs_outflow: bankMfsOutflow,
                total_dues_collected: totalDuesCollected,
                total_supplier_paid: totalSupplierPaid,
                total_expenses: totalExpenses
            },
            transactions: trxsRes.rows
        });
    } catch (error) {
        console.error('getDayCloseSummary error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Lock Chain: Safe Account Deletion
exports.deleteAccount = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const accRes = await pool.query('SELECT * FROM payment_accounts WHERE id = $1', [id]);
        if (!accRes.rows.length) {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }
        const acc = accRes.rows[0];

        // 1. Lock Chain: Account Transactions
        const trxCheck = await pool.query('SELECT COUNT(*) FROM account_transactions WHERE account_id = $1', [id]);
        const txCount = parseInt(trxCheck.rows[0].count, 10) || 0;
        if (txCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete account: ${txCount} transactions are recorded under this account. Financial records cannot be deleted.`
            });
        }

        // 2. Lock Chain: Sales payments
        const salesCheck = await pool.query('SELECT COUNT(*) FROM sales WHERE payment_method_id = $1', [id]).catch(() => ({ rows: [{ count: 0 }] }));
        const salesCount = parseInt(salesCheck.rows[0].count, 10) || 0;
        if (salesCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete account: ${salesCount} sales invoices are linked to this payment method.`
            });
        }

        // 3. Lock Chain: Purchase payments
        const poPayCheck = await pool.query('SELECT COUNT(*) FROM purchase_order_payments WHERE account_id = $1', [id]).catch(() => ({ rows: [{ count: 0 }] }));
        const poPayCount = parseInt(poPayCheck.rows[0].count, 10) || 0;
        if (poPayCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete account: ${poPayCount} purchase order payments are linked to this account.`
            });
        }

        // 4. Lock Chain: Expense records
        const expCheck = await pool.query('SELECT COUNT(*) FROM expenses WHERE account_id = $1', [id]).catch(() => ({ rows: [{ count: 0 }] }));
        const expCount = parseInt(expCheck.rows[0].count, 10) || 0;
        if (expCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete account: ${expCount} expense entries are recorded under this account.`
            });
        }

        // 5. Lock Chain: Non-zero balance
        const bal = Math.abs(parseFloat(acc.balance || 0));
        if (bal > 0.01) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete account: Active balance of ৳ ${acc.balance} must be transferred or withdrawn first.`
            });
        }

        await pool.query('UPDATE payment_accounts SET is_active = false WHERE id = $1', [id]);
        await pool.query(`
            INSERT INTO trash_records (table_name, record_id, record_title, record_data, deleted_at)
            VALUES ('payment_accounts', $1, $2, $3, NOW())
        `, [id, acc.name || `Account #${id}`, JSON.stringify(acc)]).catch(() => null);

        return res.status(200).json({ success: true, message: `Account "${acc.name}" moved to Trash successfully!` });
    } catch (error) {
        console.error('deleteAccount error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

