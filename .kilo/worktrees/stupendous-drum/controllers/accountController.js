const pool = require('../config/db');
const { ensureAccountLedgerSchema, recordAccountTransaction } = require('../services/accountLedgerService');

// Transaction ID and Account Number columns নিশ্চিত করা
const ensureAccountColumns = async () => {
    try {
        await ensureAccountLedgerSchema();
    } catch (e) {
        console.error('ensureAccountColumns error:', e.message);
    }
};

// নতুন অ্যাকাউন্ট তৈরি (Manual বা Auto)
exports.createAccount = async (req, res) => {
    try {
        await ensureAccountColumns();
        const { name, account_type = 'drawer', balance = 0, account_number = '', tender_id, tenderId } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'অ্যাকাউন্টের নাম দিন।' });

        const trimmedName = name.trim();
        const trimmedNumber = typeof account_number === 'string' ? account_number.trim() : '';
        const finalTenderId = tender_id ? parseInt(tender_id, 10) : (tenderId ? parseInt(tenderId, 10) : null);

        const query = `
            INSERT INTO payment_accounts (name, account_type, balance, account_number, is_active, tender_id) 
            VALUES ($1, $2, $3, NULLIF($4, ''), true, $5)
            ON CONFLICT (name) 
            DO UPDATE SET 
                account_type = EXCLUDED.account_type,
                account_number = COALESCE(EXCLUDED.account_number, payment_accounts.account_number),
                is_active = true,
                tender_id = COALESCE(EXCLUDED.tender_id, payment_accounts.tender_id)
            RETURNING *;
        `;
        const result = await pool.query(query, [trimmedName, account_type, balance, trimmedNumber, finalTenderId]);

        if (Number(balance) > 0) {
            const client = await pool.connect();
            try {
                await recordAccountTransaction(client, {
                    accountId: result.rows[0].id,
                    transactionType: 'credit',
                    type: 'deposit',
                    amount: balance,
                    sourceType: 'opening_balance',
                    sourceId: result.rows[0].id,
                    reference: 'Opening Balance',
                    note: 'Initial opening balance for new account',
                    updateBalance: false,
                });
            } finally {
                client.release();
            }
        }
        
        return res.status(201).json({
            success: true,
            message: 'অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে।',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Account creation error:', error);
        return res.status(500).json({ success: false, message: error.message || 'সার্ভার এরর হয়েছে।' });
    }
};

// সকল অ্যাকাউন্টের তালিকা এবং ব্যালেন্স দেখা
exports.getAccounts = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT a.*, a.name AS account_name, t.name AS tender_name,
                (SELECT COUNT(*) FROM account_transactions tr WHERE tr.account_id = a.id)::int AS tx_count,
                (SELECT COUNT(*) FROM purchase_order_payments p WHERE p.account_id = a.id)::int AS po_count,
                (SELECT COUNT(*) FROM expenses e WHERE e.account_id = a.id)::int AS expense_count,
                (SELECT COUNT(*) FROM sales s WHERE s.payment_method_id = a.id)::int AS sales_count
            FROM payment_accounts a
            LEFT JOIN tenders t ON a.tender_id = t.id
            WHERE COALESCE(a.account_type, '') != 'wallet' AND COALESCE(a.is_active, true) = true
            ORDER BY a.id ASC;
        `);
        const rows = result.rows.map((r) => {
            const usage = Number(r.tx_count || 0) + Number(r.po_count || 0) + Number(r.expense_count || 0) + Number(r.sales_count || 0);
            const hasAmount = Math.abs(parseFloat(r.balance || 0)) > 0.01;
            return {
                ...r,
                usage_count: usage,
                has_history: usage > 0,
                has_amount: hasAmount,
                is_deletable: !hasAmount && usage === 0
            };
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
        await ensureAccountColumns();
        const id = Number(req.params.id);
        const { name, account_type, account_number, tender_id, tenderId } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'অ্যাকাউন্টের নাম দিন।' });
        }

        const accRes = await pool.query('SELECT * FROM payment_accounts WHERE id = $1 AND is_active = true', [id]);
        if (!accRes.rows.length) {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }

        const allowed = ['cash', 'drawer', 'bank', 'mfs', 'card'];
        let rawType = String(account_type || accRes.rows[0].account_type || 'drawer').toLowerCase();
        if (['bkash', 'nagad', 'wallet', 'mobile', 'upi'].includes(rawType)) {
            rawType = 'mfs';
        }
        const finalType = allowed.includes(rawType) ? rawType : 'drawer';

        const finalNumber = account_number === undefined ? accRes.rows[0].account_number : account_number;
        const finalTenderId = tender_id !== undefined ? (tender_id ? parseInt(tender_id, 10) : null) : (tenderId !== undefined ? (tenderId ? parseInt(tenderId, 10) : null) : accRes.rows[0].tender_id);

        const result = await pool.query(
            'UPDATE payment_accounts SET name = $1, account_type = $2, account_number = NULLIF($3, \'\'), tender_id = $4 WHERE id = $5 RETURNING *',
            [name.trim(), finalType, finalNumber || '', finalTenderId, id]
        );

        // Also sync with accounts table if exists
        const oldName = accRes.rows[0].name;
        await pool.query(
            'UPDATE accounts SET account_name = $1, location = COALESCE(NULLIF($2, \'\'), location), tender_id = COALESCE($3, tender_id) WHERE LOWER(account_name) = LOWER($4)',
            [name.trim(), finalNumber || '', finalTenderId, oldName]
        ).catch(() => null);

        let tenderName = null;
        if (finalTenderId) {
            const tRes = await pool.query('SELECT name FROM tenders WHERE id = $1', [finalTenderId]);
            tenderName = tRes.rows[0]?.name || null;
        }

        return res.status(200).json({
            success: true,
            message: 'অ্যাকাউন্ট সফলভাবে আপডেট হয়েছে।',
            data: { ...result.rows[0], tender_name: tenderName }
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

        await client.query('BEGIN');

        const result = await recordAccountTransaction(client, {
            accountId: account_id,
            transactionType: 'credit',
            type: 'deposit',
            amount,
            sourceType: 'manual_deposit',
            reference: reference || 'Cash Deposit',
            note: note || 'Manual account deposit',
            transactionId: transaction_id || null,
            createdBy: req.user?.name || null,
        });

        await client.query('COMMIT');

        return res.status(200).json({
            success: true,
            message: 'টাকা সফলভাবে জমা হয়েছে।',
            data: result
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Deposit error:', error);
        return res.status(500).json({ success: false, message: error.message || 'সার্ভার এরর হয়েছে।' });
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

        await client.query('BEGIN');

        // ব্যালেন্স পর্যাপ্ত আছে কি না চেক করা
        const accCheck = await client.query('SELECT balance FROM payment_accounts WHERE id = $1 FOR UPDATE', [account_id]);
        if (accCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'অ্যাকাউন্ট পাওয়া যায়নি।' });
        }

        const currentBalance = Number(accCheck.rows[0].balance);
        if (currentBalance < Number(amount)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই।' });
        }

        const result = await recordAccountTransaction(client, {
            accountId: account_id,
            transactionType: 'debit',
            type: 'withdraw',
            amount,
            sourceType: 'manual_withdraw',
            reference: reference || 'Cash Withdraw',
            note: note || 'Manual account withdrawal',
            transactionId: transaction_id || null,
            createdBy: req.user?.name || null,
        });

        await client.query('COMMIT');

        return res.status(200).json({
            success: true,
            message: 'টাকা সফলভাবে উত্তোলন করা হয়েছে।',
            data: result
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Withdraw error:', error);
        return res.status(500).json({ success: false, message: error.message || 'সার্ভার এরর হয়েছে।' });
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
        const accCheck = await client.query('SELECT balance FROM payment_accounts WHERE id = $1 FOR UPDATE', [account_id]);
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
            await client.query('UPDATE suppliers SET payable_balance = payable_balance - $1 WHERE id = $2', [amount, party_id]);
            await recordAccountTransaction(client, {
                accountId: account_id,
                transactionType: 'debit',
                type: 'due_payment',
                amount,
                sourceType: 'supplier_payment',
                sourceId: party_id,
                reference: `Supplier ID: #${party_id}`,
                note: note || 'Due Payment to Supplier',
            });

        } else if (party_type === 'customer') {
            // কাস্টমার পেমেন্ট দিলে (বকেয়া পরিশোধ করলে) ওয়ালেটে টাকা বাড়বে এবং receivable_balance কমবে
            await client.query('UPDATE customers SET receivable_balance = receivable_balance - $1 WHERE id = $2', [amount, party_id]);
            await recordAccountTransaction(client, {
                accountId: account_id,
                transactionType: 'credit',
                type: 'due_receive',
                amount,
                sourceType: 'due_collection',
                sourceId: party_id,
                reference: `Customer ID: #${party_id}`,
                note: note || 'Due Received from Customer',
            });
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

        await client.query('BEGIN');

        const sourceCheck = await client.query('SELECT balance, name FROM payment_accounts WHERE id = $1 FOR UPDATE', [from_wallet_id]);
        if (sourceCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'উৎস ওয়ালেট পাওয়া যায়নি।' });
        }
        if (Number(sourceCheck.rows[0].balance) < numAmount) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'পর্যাপ্ত ব্যালেন্স নেই।' });
        }

        const destCheck = await client.query('SELECT balance, name FROM payment_accounts WHERE id = $1 FOR UPDATE', [to_wallet_id]);
        if (destCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'গন্তব্য ওয়ালেট পাওয়া যায়নি।' });
        }

        const fromName = sourceCheck.rows[0].name;
        const toName = destCheck.rows[0].name;

        await recordAccountTransaction(client, {
            accountId: from_wallet_id,
            transactionType: 'debit',
            type: 'transfer_out',
            amount: numAmount,
            sourceType: 'transfer',
            sourceId: to_wallet_id,
            reference: `Transfer to ${toName} (#${to_wallet_id})`,
            note: note || '',
            transactionId: transaction_id || null,
            createdBy: req.user?.name || null,
        });

        await recordAccountTransaction(client, {
            accountId: to_wallet_id,
            transactionType: 'credit',
            type: 'transfer_in',
            amount: numAmount,
            sourceType: 'transfer',
            sourceId: from_wallet_id,
            reference: `Transfer from ${fromName} (#${from_wallet_id})`,
            note: note || '',
            transactionId: transaction_id || null,
            createdBy: req.user?.name || null,
        });

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

// সকল ট্রানজেকশন তালিকা দেখা (Filterable & Searchable)
exports.getTransactions = async (req, res) => {
    try {
        await ensureAccountLedgerSchema();
        const { account_id, type, transaction_type, source_type, start_date, end_date, search, limit = 200 } = req.query;
        const params = [];
        const conditions = [];

        if (account_id && account_id !== 'all') {
            params.push(parseInt(account_id, 10));
            conditions.push(`t.account_id = $${params.length}`);
        }

        if (type && type !== 'all') {
            params.push(type);
            conditions.push(`t.type = $${params.length}`);
        }

        if (transaction_type && transaction_type !== 'all') {
            params.push(transaction_type);
            conditions.push(`t.transaction_type = $${params.length}`);
        }

        if (source_type && source_type !== 'all') {
            params.push(source_type);
            conditions.push(`t.source_type = $${params.length}`);
        }

        if (start_date) {
            params.push(start_date);
            conditions.push(`t.created_at >= $${params.length}`);
        }

        if (end_date) {
            params.push(end_date + ' 23:59:59.999');
            conditions.push(`t.created_at <= $${params.length}`);
        }

        if (search && search.trim()) {
            params.push(`%${search.trim()}%`);
            conditions.push(`(t.reference ILIKE $${params.length} OR t.note ILIKE $${params.length} OR t.transaction_id ILIKE $${params.length} OR p.name ILIKE $${params.length})`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const limitNum = Math.min(1000, Math.max(1, parseInt(limit, 10) || 200));

        const result = await pool.query(`
            SELECT t.*, p.name AS account_name, p.account_type
            FROM account_transactions t
            LEFT JOIN payment_accounts p ON t.account_id = p.id
            ${whereClause}
            ORDER BY t.created_at DESC, t.id DESC
            LIMIT ${limitNum};
        `, params);

        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('getTransactions error:', error);
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

// ট্রানজেকশন আপডেট (Edit Transaction) — Strictly Prohibited for Immutable Audit Trail
exports.updateTransaction = async (req, res) => {
    return res.status(403).json({
        success: false,
        message: 'Direct modification of ledger transactions is strictly prohibited to preserve accounting audit trail integrity and prevent balance discrepancies. Please post an offsetting adjustment transaction.'
    });
};

// ট্রানজেকশন ডিলিট (Delete Transaction) — Strictly Prohibited for Immutable Audit Trail
exports.deleteTransaction = async (req, res) => {
    return res.status(403).json({
        success: false,
        message: 'Direct deletion of ledger transactions is strictly prohibited to preserve financial compliance and immutable audit records. Post a reversing adjustment entry instead.'
    });
};

// রিভার্সাল / অফসেটিং ট্রানজেকশন এন্ট্রি (Post Reversing / Adjustment Entry)
exports.reverseTransaction = async (req, res) => {
    const client = await pool.connect();
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid transaction ID.' });

        const { reason, note, transaction_id } = req.body;

        await client.query('BEGIN');
        await ensureAccountLedgerSchema(client);

        const oldTxRes = await client.query('SELECT * FROM account_transactions WHERE id = $1', [id]);
        if (oldTxRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Transaction record not found.' });
        }

        const oldTx = oldTxRes.rows[0];
        const oldAccId = oldTx.account_id;
        const oldAmt = parseFloat(oldTx.amount || 0);
        const isCredit = oldTx.transaction_type === 'credit' || ['deposit', 'credit', 'in', 'transfer_in', 'due_receive', 'advance_receive', 'sale_payment', 'sale_revenue'].includes(oldTx.type);

        if (oldAmt <= 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'Cannot reverse transaction with zero amount.' });
        }

        // Determine opposite offsetting transaction
        const revTxType = isCredit ? 'debit' : 'credit';
        const revType = isCredit ? 'debit_reverse' : 'credit_reverse';
        const revReference = oldTx.reference ? `REV-${oldTx.reference}` : `REV-TX-${id}`;
        const revNote = note || (reason ? `Reversal: ${reason}` : `Offsetting cancellation adjustment for Transaction #${id} (${oldTx.type || oldTx.source_type || 'manual'})`);

        // Record offsetting ledger entry without mutating original record
        const result = await recordAccountTransaction(client, {
            accountId: oldAccId,
            transactionType: revTxType,
            type: revType,
            amount: oldAmt,
            sourceType: 'cancellation_adjustment',
            sourceId: String(id),
            reference: revReference,
            note: revNote,
            transactionId: transaction_id || oldTx.transaction_id || null,
            createdBy: req.user?.name || req.body.created_by || 'System Admin',
        });

        await client.query('COMMIT');
        return res.status(200).json({
            success: true,
            message: `Offsetting reversal transaction created successfully for Transaction #${id}.`,
            data: result
        });
    } catch (error) {
        await client.query('ROLLBACK').catch(() => null);
        console.error('reverseTransaction error:', error);
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};

// Lock Chain: Safe Account Deletion (with Force Delete support)
exports.deleteAccount = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const isForce = req.query?.force === 'true' || req.body?.force === true;

        const accRes = await pool.query('SELECT * FROM payment_accounts WHERE id = $1', [id]);
        if (!accRes.rows.length) {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }
        const acc = accRes.rows[0];

        if (!isForce) {
            // 1. Lock Chain: Account Transactions
            const trxCheck = await pool.query('SELECT COUNT(*) FROM account_transactions WHERE account_id = $1', [id]);
            const txCount = parseInt(trxCheck.rows[0].count, 10) || 0;
            if (txCount > 0) {
                return res.status(400).json({
                    success: false,
                    is_locked: true,
                    message: `Cannot delete account: ${txCount} transactions are recorded under this account. Financial records cannot be deleted.`
                });
            }

            // 2. Lock Chain: Sales payments
            const salesCheck = await pool.query('SELECT COUNT(*) FROM sales WHERE payment_method_id = $1', [id]).catch(() => ({ rows: [{ count: 0 }] }));
            const salesCount = parseInt(salesCheck.rows[0].count, 10) || 0;
            if (salesCount > 0) {
                return res.status(400).json({
                    success: false,
                    is_locked: true,
                    message: `Cannot delete account: ${salesCount} sales invoices are linked to this payment method.`
                });
            }

            // 3. Lock Chain: Purchase payments
            const poPayCheck = await pool.query('SELECT COUNT(*) FROM purchase_order_payments WHERE account_id = $1', [id]).catch(() => ({ rows: [{ count: 0 }] }));
            const poPayCount = parseInt(poPayCheck.rows[0].count, 10) || 0;
            if (poPayCount > 0) {
                return res.status(400).json({
                    success: false,
                    is_locked: true,
                    message: `Cannot delete account: ${poPayCount} purchase order payments are linked to this account.`
                });
            }

            // 4. Lock Chain: Expense records
            const expCheck = await pool.query('SELECT COUNT(*) FROM expenses WHERE account_id = $1', [id]).catch(() => ({ rows: [{ count: 0 }] }));
            const expCount = parseInt(expCheck.rows[0].count, 10) || 0;
            if (expCount > 0) {
                return res.status(400).json({
                    success: false,
                    is_locked: true,
                    message: `Cannot delete account: ${expCount} expense entries are recorded under this account.`
                });
            }

            // 5. Lock Chain: Non-zero balance
            const bal = Math.abs(parseFloat(acc.balance || 0));
            if (bal > 0.01) {
                return res.status(400).json({
                    success: false,
                    is_locked: true,
                    message: `Cannot delete account: Active balance of ৳ ${acc.balance} must be transferred or withdrawn first.`
                });
            }
        }

        // If force delete or unlocked: Clean up linked records
        if (isForce) {
            await pool.query('DELETE FROM account_transactions WHERE account_id = $1', [id]).catch(() => null);
            await pool.query('DELETE FROM accounts WHERE LOWER(account_name) = LOWER($1)', [acc.name]).catch(() => null);
        }

        await pool.query('DELETE FROM payment_accounts WHERE id = $1', [id]);
        await pool.query(`
            INSERT INTO trash_records (table_name, record_id, record_title, record_data, deleted_at)
            VALUES ('payment_accounts', $1, $2, $3, NOW())
        `, [id, acc.name || `Account #${id}`, JSON.stringify(acc)]).catch(() => null);

        return res.status(200).json({ success: true, message: `Account "${acc.name}" deleted successfully!` });
    } catch (error) {
        console.error('deleteAccount error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// TENDER & NEW ACCOUNT CREATION MODULE
// ==========================================

exports.getTenders = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tenders ORDER BY id ASC');
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('getTenders error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.createTender = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Tender name is required.' });
        }
        const trimmed = name.trim();
        const result = await pool.query(`
            INSERT INTO tenders (name) VALUES ($1)
            ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
            RETURNING *
        `, [trimmed]);
        return res.status(201).json({ success: true, message: 'Tender created successfully!', data: result.rows[0] });
    } catch (error) {
        console.error('createTender error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateTender = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { name } = req.body;
        if (isNaN(id) || !name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Valid Tender ID and name are required.' });
        }
        const trimmed = name.trim();
        const result = await pool.query(
            'UPDATE tenders SET name = $1 WHERE id = $2 RETURNING *',
            [trimmed, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Tender not found.' });
        }
        return res.status(200).json({ success: true, message: 'Tender updated successfully!', data: result.rows[0] });
    } catch (error) {
        console.error('updateTender error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteTender = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid Tender ID.' });

        // Check if any accounts belong to this tender
        const accCheck = await pool.query('SELECT COUNT(*) FROM accounts WHERE tender_id = $1', [id]);
        const accCount = parseInt(accCheck.rows[0].count, 10);
        if (accCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete tender: ${accCount} active account(s) are linked to this tender. Please reassign or delete those accounts first.`
            });
        }

        const result = await pool.query('DELETE FROM tenders WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Tender not found.' });
        }
        return res.status(200).json({ success: true, message: 'Tender deleted successfully!' });
    } catch (error) {
        console.error('deleteTender error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAccountsList = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT a.*, t.name AS tender_name,
                (SELECT COUNT(*) FROM account_transactions tr JOIN payment_accounts p ON tr.account_id = p.id WHERE LOWER(p.name) = LOWER(a.account_name))::int AS tx_count,
                (SELECT COUNT(*) FROM sales s JOIN payment_accounts p ON s.payment_method_id = p.id WHERE LOWER(p.name) = LOWER(a.account_name))::int AS sales_count,
                (SELECT COUNT(*) FROM purchase_order_payments pop JOIN payment_accounts p ON pop.account_id = p.id WHERE LOWER(p.name) = LOWER(a.account_name))::int AS po_count,
                (SELECT COUNT(*) FROM expenses e JOIN payment_accounts p ON e.account_id = p.id WHERE LOWER(p.name) = LOWER(a.account_name))::int AS exp_count
            FROM accounts a 
            LEFT JOIN tenders t ON a.tender_id = t.id 
            ORDER BY a.id ASC
        `);
        const rows = result.rows.map(r => {
            const usage = Number(r.tx_count || 0) + Number(r.sales_count || 0) + Number(r.po_count || 0) + Number(r.exp_count || 0);
            const hasAmount = Math.abs(parseFloat(r.current_balance || 0)) > 0.01;
            return {
                ...r,
                usage_count: usage,
                has_history: usage > 0,
                has_amount: hasAmount,
                is_deletable: !hasAmount && usage === 0
            };
        });
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('getAccountsList error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.createAccountRecord = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const tender_id = req.body.tender_id || req.body.tenderId;
        const account_name = req.body.account_name || req.body.accountName;
        const location = req.body.location || '';
        const opening_balance = req.body.opening_balance ?? req.body.openingBalance ?? 0;
        const reference_id = req.body.reference_id || req.body.referenceId || '';
        const created_by = req.body.created_by || req.body.createdBy || '';

        if (!tender_id) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'Please select a parent Tender first.' });
        }
        if (!account_name || !String(account_name).trim()) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'Account name is required.' });
        }

        const trimmedAccName = account_name.trim();
        const trimmedLocation = typeof location === 'string' ? location.trim() : '';
        const trimmedRef = typeof reference_id === 'string' ? reference_id.trim() : '';
        const opBal = parseFloat(opening_balance || 0) || 0;
        const activeUser = created_by || req.user?.name || 'Super Admin';

        // Check tender exists
        const tenderRes = await client.query('SELECT * FROM tenders WHERE id = $1', [tender_id]);
        if (tenderRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Selected Tender does not exist.' });
        }
        const tender = tenderRes.rows[0];

        // Insert into accounts table
        const insertRes = await client.query(`
            INSERT INTO accounts (tender_id, account_name, location, opening_balance, current_balance, reference_id, created_by, created_at)
            VALUES ($1, $2, $3, $4, $4, $5, $6, NOW())
            RETURNING *
        `, [tender_id, trimmedAccName, trimmedLocation, opBal, trimmedRef, activeUser]);

        // Sync with payment_accounts for immediate use in invoice Multi-Tender dropdowns
        const tenderNameLower = tender.name.toLowerCase();
        const accType = tenderNameLower.includes('bank') ? 'bank' : tenderNameLower.includes('cash') ? 'drawer' : 'mfs';
        const pAccRes = await client.query(`
            INSERT INTO payment_accounts (name, account_type, balance, account_number, is_active, tender_id)
            VALUES ($1, $2, $3, NULLIF($4, ''), true, $5)
            ON CONFLICT (name) DO UPDATE SET 
                balance = EXCLUDED.balance,
                account_type = EXCLUDED.account_type,
                account_number = COALESCE(EXCLUDED.account_number, payment_accounts.account_number),
                is_active = true,
                tender_id = EXCLUDED.tender_id
            RETURNING *
        `, [trimmedAccName, accType, opBal, trimmedLocation, tender_id]);

        if (opBal > 0 && pAccRes.rows.length) {
            await recordAccountTransaction(client, {
                accountId: pAccRes.rows[0].id,
                transactionType: 'credit',
                type: 'deposit',
                amount: opBal,
                sourceType: 'opening_balance',
                sourceId: insertRes.rows[0].id,
                reference: trimmedRef || 'Opening Balance',
                note: `Initial opening balance for account "${trimmedAccName}"`,
                createdBy: activeUser,
                updateBalance: false,
            });
        }

        await client.query('COMMIT');
        return res.status(201).json({
            success: true,
            message: 'Account created successfully!',
            data: { ...insertRes.rows[0], tender_name: tender.name, tender_id: tender.id }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('createAccountRecord error:', error);
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};

exports.updateAccountRecord = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'Invalid account ID.' });
        }

        const tender_id = req.body.tender_id || req.body.tenderId;
        const account_name = req.body.account_name || req.body.accountName;
        const location = req.body.location;
        const opening_balance = req.body.opening_balance ?? req.body.openingBalance;
        const current_balance = req.body.current_balance ?? req.body.currentBalance;
        const reference_id = req.body.reference_id || req.body.referenceId;

        const oldAccRes = await client.query('SELECT * FROM accounts WHERE id = $1', [id]);
        if (oldAccRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Account not found.' });
        }
        const oldAcc = oldAccRes.rows[0];

        const finalTenderId = tender_id ? parseInt(tender_id, 10) : oldAcc.tender_id;
        const finalAccName = account_name ? String(account_name).trim() : oldAcc.account_name;
        const finalLocation = location !== undefined ? String(location).trim() : oldAcc.location;
        const finalOpBal = opening_balance !== undefined ? parseFloat(opening_balance || 0) : parseFloat(oldAcc.opening_balance || 0);
        const finalCurBal = current_balance !== undefined ? parseFloat(current_balance || 0) : parseFloat(oldAcc.current_balance || 0);
        const finalRef = reference_id !== undefined ? String(reference_id).trim() : oldAcc.reference_id;

        const tenderRes = await client.query('SELECT * FROM tenders WHERE id = $1', [finalTenderId]);
        const tenderName = tenderRes.rows[0]?.name || 'Cash';

        const updateRes = await client.query(`
            UPDATE accounts 
            SET tender_id = $1, account_name = $2, location = $3, opening_balance = $4, current_balance = $5, reference_id = $6
            WHERE id = $7
            RETURNING *
        `, [finalTenderId, finalAccName, finalLocation, finalOpBal, finalCurBal, finalRef, id]);

        // Sync with payment_accounts
        const tenderNameLower = tenderName.toLowerCase();
        const accType = tenderNameLower.includes('bank') ? 'bank' : tenderNameLower.includes('cash') ? 'drawer' : 'mfs';
        await client.query(`
            UPDATE payment_accounts 
            SET name = $1, account_type = $2, account_number = NULLIF($3, ''), balance = $4, is_active = true, tender_id = $5
            WHERE LOWER(name) = LOWER($6)
        `, [finalAccName, accType, finalLocation, finalCurBal, finalTenderId, oldAcc.account_name]);

        await client.query('COMMIT');
        return res.status(200).json({
            success: true,
            message: 'Account updated successfully!',
            data: { ...updateRes.rows[0], tender_name: tenderName, tender_id: finalTenderId }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('updateAccountRecord error:', error);
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};

exports.updateAccountBalance = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const current_balance = req.body.current_balance !== undefined ? req.body.current_balance : req.body.currentBalance;
        if (isNaN(id) || current_balance === undefined) {
            return res.status(400).json({ success: false, message: 'Valid account ID and current balance are required.' });
        }
        const newBal = parseFloat(current_balance || 0);
        const result = await pool.query(`
            UPDATE accounts SET current_balance = $1 WHERE id = $2 RETURNING *
        `, [newBal, id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Account record not found.' });
        }
        return res.status(200).json({ success: true, message: 'Account balance updated.', data: result.rows[0] });
    } catch (error) {
        console.error('updateAccountBalance error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteAccountRecord = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const isForce = req.query?.force === 'true' || req.body?.force === true;
        if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });

        const accRes = await pool.query('SELECT * FROM accounts WHERE id = $1', [id]);
        if (accRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Account record not found.' });
        }
        const acc = accRes.rows[0];

        // Find linked payment_account
        const pAccRes = await pool.query('SELECT * FROM payment_accounts WHERE LOWER(name) = LOWER($1)', [acc.account_name]);
        const pAcc = pAccRes.rows[0];
        const pAccId = pAcc ? pAcc.id : null;

        if (!isForce) {
            // 1. Lock Check: Active balance
            const bal = Math.abs(parseFloat(acc.current_balance || (pAcc ? pAcc.balance : 0) || 0));
            if (bal > 0.01) {
                return res.status(400).json({
                    success: false,
                    is_locked: true,
                    message: `Cannot delete account: Account "${acc.account_name}" has an active balance of ৳ ${bal.toFixed(2)}. Please transfer or withdraw the balance first.`
                });
            }

            // 2. Lock Check: Transaction history
            if (pAccId) {
                const txCheck = await pool.query('SELECT COUNT(*) FROM account_transactions WHERE account_id = $1', [pAccId]);
                const txCount = parseInt(txCheck.rows[0].count, 10) || 0;
                if (txCount > 0) {
                    return res.status(400).json({
                        success: false,
                        is_locked: true,
                        message: `Cannot delete account: ${txCount} transaction ledger entries are recorded under this account. Financial records cannot be deleted.`
                    });
                }

                const salesCheck = await pool.query('SELECT COUNT(*) FROM sales WHERE payment_method_id = $1', [pAccId]).catch(() => ({ rows: [{ count: 0 }] }));
                const salesCount = parseInt(salesCheck.rows[0].count, 10) || 0;
                if (salesCount > 0) {
                    return res.status(400).json({
                        success: false,
                        is_locked: true,
                        message: `Cannot delete account: ${salesCount} sales invoices are linked to this payment account.`
                    });
                }

                const poPayCheck = await pool.query('SELECT COUNT(*) FROM purchase_order_payments WHERE account_id = $1', [pAccId]).catch(() => ({ rows: [{ count: 0 }] }));
                const poCount = parseInt(poPayCheck.rows[0].count, 10) || 0;
                if (poCount > 0) {
                    return res.status(400).json({
                        success: false,
                        is_locked: true,
                        message: `Cannot delete account: ${poCount} purchase order payments are linked to this account.`
                    });
                }

                const expCheck = await pool.query('SELECT COUNT(*) FROM expenses WHERE account_id = $1', [pAccId]).catch(() => ({ rows: [{ count: 0 }] }));
                const expCount = parseInt(expCheck.rows[0].count, 10) || 0;
                if (expCount > 0) {
                    return res.status(400).json({
                        success: false,
                        is_locked: true,
                        message: `Cannot delete account: ${expCount} expense records are recorded under this account.`
                    });
                }
            }
        }

        if (pAccId) {
            if (isForce) {
                await pool.query('DELETE FROM account_transactions WHERE account_id = $1', [pAccId]).catch(() => null);
            }
            await pool.query('DELETE FROM payment_accounts WHERE id = $1', [pAccId]);
        }

        await pool.query('DELETE FROM accounts WHERE id = $1', [id]);
        return res.status(200).json({ success: true, message: `Account "${acc.account_name}" deleted successfully.` });
    } catch (error) {
        console.error('deleteAccountRecord error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

