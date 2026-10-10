const pool = require('../../config/db');
const { recordAccountTransaction } = require('../../services/accountLedgerService');
const { ensureExpenseTables } = require('./expenseQueryController');

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
            voucher_no: custom_voucher_no,
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

        // Generate unique voucher number: e.g. EXP-2026-0819 or use provided voucher_no
        const voucher_no = custom_voucher_no || ('EXP-' + new Date().getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 9000)));

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

        // 2. Deduct from selected account and record transaction if provided
        if (account_id) {
            await recordAccountTransaction(client, {
                accountId: account_id,
                transactionType: 'debit',
                type: 'expense',
                amount: numAmount,
                sourceType: 'expense',
                sourceId: expResult.rows[0].id,
                reference: voucher_no,
                note: `Expense: ${category_name || 'General'} to ${payee_name || 'N/A'}${note ? ` (${note})` : ''}`,
                createdBy: req.user?.name || null,
            });
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
            message: 'Expense recorded successfully',
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
// Delete Expense (Soft Delete into Trash & Rebalance Account)
// -------------------------------------------------------------
exports.deleteExpense = async (req, res) => {
    const client = await pool.connect();
    try {
        await ensureExpenseTables();
        const { id } = req.params;

        await client.query('BEGIN');

        const existing = await client.query('SELECT * FROM expenses WHERE id = $1', [id]);
        if (!existing.rows.length) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Expense record not found.' });
        }
        const exp = existing.rows[0];

        // Restore balance to account
        if (exp.account_id && exp.amount) {
            await recordAccountTransaction(client, {
                accountId: exp.account_id,
                transactionType: 'credit',
                type: 'deposit',
                amount: parseFloat(exp.amount),
                sourceType: 'expense',
                sourceId: id,
                reference: exp.voucher_no || `EXP-${id}`,
                note: `Expense deleted (${exp.voucher_no || id}) — amount restored to account`,
            });
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
                await recordAccountTransaction(client, {
                    accountId: effectiveAccountId,
                    transactionType: diff > 0 ? 'debit' : 'credit',
                    type: diff > 0 ? 'expense' : 'deposit',
                    amount: Math.abs(diff),
                    sourceType: 'expense',
                    sourceId: id,
                    reference: oldExp.voucher_no || `EXP-${id}`,
                    note: `Expense ${oldExp.voucher_no || id} edited: amount changed by ৳${Math.abs(diff).toLocaleString()}`,
                });
            }
        } else {
            // Case 2: Account changed
            if (oldAccountId) {
                await recordAccountTransaction(client, {
                    accountId: oldAccountId,
                    transactionType: 'credit',
                    type: 'deposit',
                    amount: oldAmount,
                    sourceType: 'expense',
                    sourceId: id,
                    reference: oldExp.voucher_no || `EXP-${id}`,
                    note: `Expense ${oldExp.voucher_no || id} edited: account changed — ৳${oldAmount.toLocaleString()} restored`,
                });
            }
            if (effectiveAccountId) {
                await recordAccountTransaction(client, {
                    accountId: effectiveAccountId,
                    transactionType: 'debit',
                    type: 'expense',
                    amount: newAmount,
                    sourceType: 'expense',
                    sourceId: id,
                    reference: oldExp.voucher_no || `EXP-${id}`,
                    note: `Expense ${oldExp.voucher_no || id} edited: ৳${newAmount.toLocaleString()} debited from account`,
                });
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
