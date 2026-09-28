const pool = require('../../config/db');
const { ensureAccountLedgerSchema, recordAccountTransaction } = require('../../services/accountLedgerService');

const ensureAccountColumns = async () => {
    try {
        await ensureAccountLedgerSchema();
    } catch (e) {
        console.error('ensureAccountColumns error:', e.message);
    }
};

// Create new payment account (Manual or Auto)
exports.createAccount = async (req, res) => {
    try {
        await ensureAccountColumns();
        const accountName = req.body.accountName || req.body.name;
        const methodType = req.body.methodType || req.body.account_type || 'drawer';
        const { balance = 0, account_number = '', tender_id, tenderId } = req.body;
        if (!accountName || !String(accountName).trim()) {
            return res.status(400).json({ success: false, message: 'Account name is required.' });
        }

        const trimmedName = String(accountName).trim();
        const trimmedNumber = typeof account_number === 'string' ? account_number.trim() : '';
        const finalTenderId = tender_id ? parseInt(tender_id, 10) : (tenderId ? parseInt(tenderId, 10) : null);

        // Check if an account already exists with the same methodType and accountName
        const existingCheck = await pool.query(
            'SELECT id FROM payment_accounts WHERE LOWER(account_type) = LOWER($1) AND LOWER(name) = LOWER($2) AND deleted_at IS NULL LIMIT 1',
            [methodType, trimmedName]
        );
        if (existingCheck.rows.length > 0) {
            return res.status(409).json({
                success: false,
                code: 'CONFLICT',
                message: `An account named "${trimmedName}" already exists for the selected payment method.`
            });
        }

        const query = `
            INSERT INTO payment_accounts (name, account_type, balance, account_number, is_active, tender_id) 
            VALUES ($1, $2, $3, NULLIF($4, ''), true, $5)
            RETURNING *;
        `;
        const result = await pool.query(query, [trimmedName, methodType, balance, trimmedNumber, finalTenderId]);

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
            message: 'Account created successfully.',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Account creation error:', error);
        if (error.code === '23505' || error.code === 'P2002' || error.message?.includes('unique constraint') || error.message?.includes('Unique constraint failed')) {
            return res.status(409).json({
                success: false,
                code: 'CONFLICT',
                message: 'An account with this name already exists for the selected method.'
            });
        }
        return res.status(500).json({ success: false, message: error.message || 'Server error occurred.' });
    }
};

// Get list of all payment accounts
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
        return res.status(500).json({ success: false, message: 'Server error occurred.' });
    }
};

// Update payment account
exports.updateAccount = async (req, res) => {
    try {
        await ensureAccountColumns();
        const id = Number(req.params.id);
        const { name, account_type, account_number, tender_id, tenderId } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Account name is required.' });
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
            message: 'Account updated successfully.',
            data: { ...result.rows[0], tender_name: tenderName }
        });
    } catch (error) {
        console.error('updateAccount error:', error);
        return res.status(500).json({ success: false, message: error.message });
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
