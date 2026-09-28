const pool = require('../../config/db');
const { recordAccountTransaction } = require('../../services/accountLedgerService');

// Get all subledger accounts list
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

// Create a new subledger account record
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
            ON CONFLICT (account_type, name) DO UPDATE SET 
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

// Update an existing subledger account record
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

// Update account balance
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

// Safe subledger account deletion
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
