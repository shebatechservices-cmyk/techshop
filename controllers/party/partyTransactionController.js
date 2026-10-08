const pool = require('../../config/db');
const { ensureWalletSchema, writeWalletLedger } = require('../walletController');
const { recordAccountTransaction } = require('../../services/accountLedgerService');

// 5. UNIFIED FINANCIAL TRANSACTIONS (Supplier Payments, Customer Receipts, Staff Disbursals)
exports.handlePartyTransaction = async (req, res) => {
    const client = await pool.connect();
    try {
        const { party_type, party_id, action_type, account_id, amount, note, to_account_id } = req.body;
        const numAmount = parseFloat(amount);

        if (!action_type || !numAmount || numAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Valid action type and positive amount are required.' });
        }

        await client.query('BEGIN');

        // Check primary payment account
        if (action_type !== 'transfer') {
            if (!account_id) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'Please select a payment wallet/account.' });
            }
            const accCheck = await client.query('SELECT id, name, balance FROM payment_accounts WHERE id = $1', [account_id]);
            if (!accCheck.rows.length) {
                await client.query('ROLLBACK');
                return res.status(404).json({ success: false, message: 'Selected payment account does not exist.' });
            }
            const acc = accCheck.rows[0];
            const accBalance = parseFloat(acc.balance || 0);

            // =========================
            // 1. SUPPLIER TRANSACTIONS
            // =========================
            if (party_type === 'supplier') {
                const supCheck = await client.query('SELECT id, name, payable_balance FROM suppliers WHERE id = $1', [party_id]);
                if (!supCheck.rows.length) {
                    await client.query('ROLLBACK');
                    return res.status(404).json({ success: false, message: 'Supplier not found.' });
                }
                const supplier = supCheck.rows[0];

                if (action_type === 'due_payment' || action_type === 'due') {
                    // Pay supplier due: Outflow from shop account, decreases supplier payable balance
                    await client.query('UPDATE suppliers SET payable_balance = payable_balance - $1 WHERE id = $2', [numAmount, party_id]);
                    await recordAccountTransaction(client, {
                        accountId: account_id,
                        transactionType: 'debit',
                        type: 'due_payment',
                        amount: numAmount,
                        sourceType: 'supplier_payment',
                        sourceId: party_id,
                        reference: `Supplier: ${supplier.name} (#${party_id})`,
                        note: note || 'Due Settlement',
                    });

                    // Settle supplier's pending unpaid/partial purchase orders FIFO
                    const accNameRes = await client.query('SELECT name FROM payment_accounts WHERE id = $1', [account_id]);
                    const accName = accNameRes.rows[0]?.name || 'Cash';

                    const pendingPurchases = await client.query(
                        `SELECT id, po_number, total_cost, total_paid, total_due, status
                         FROM purchase_orders
                         WHERE supplier_id = $1 AND total_due > 0 AND deleted_at IS NULL
                         ORDER BY created_at ASC, id ASC
                         FOR UPDATE`,
                        [party_id]
                    );

                    let remToAllocate = numAmount;
                    for (const po of pendingPurchases.rows) {
                        if (remToAllocate <= 0) break;
                        const poDue = Number(po.total_due || 0);
                        const alloc = Math.min(remToAllocate, poDue);
                        const poPaid = Number(po.total_paid || 0) + alloc;
                        const poNewDue = Math.max(0, poDue - alloc);
                        const poStatus = poNewDue <= 0 ? 'paid' : 'partial';

                        await client.query(
                            `UPDATE purchase_orders
                             SET total_paid = $1,
                                 total_due = $2,
                                 status = $3
                             WHERE id = $4`,
                            [poPaid, poNewDue, poStatus, po.id]
                        );

                        await client.query(
                            `INSERT INTO purchase_order_payments (purchase_order_id, amount, payment_mode, created_at)
                             VALUES ($1, $2, $3, NOW())`,
                            [po.id, alloc, accName]
                        ).catch(() => {});

                        remToAllocate -= alloc;
                    }

                } else if (action_type === 'advance_payment' || action_type === 'advance') {
                    // Supplier advance = wallet deposit (drawer reservation): money stays in the shop
                    // drawer, only the supplier's wallet tag increases. Drawer & payable unchanged.
                    await ensureWalletSchema();
                    const supWalletRes = await client.query('SELECT wallet_balance FROM suppliers WHERE id = $1', [party_id]);
                    const supWallet = parseFloat(supWalletRes.rows[0]?.wallet_balance || 0) || 0;
                    await client.query('UPDATE suppliers SET wallet_balance = COALESCE(wallet_balance, 0) + $1 WHERE id = $2', [numAmount, party_id]);
                    await writeWalletLedger(client, {
                        party_type: 'supplier', party_id: Number(party_id), party_name: supplier.name,
                        type: 'advance_deposit', amount: numAmount, credit: true,
                        account_id: null, account_name: null, account_effect: 'none', cash_drawer_effect: 'none',
                        reference: null, note: (note && note !== 'Supplier Advance') ? note : 'Supplier advance held in wallet (drawer unchanged)',
                        balance_before: supWallet, balance_after: supWallet + numAmount,
                    });

                } else {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ success: false, message: 'Invalid supplier action. Suppliers only support Due Payment or Advance Payment.' });
                }

            // =========================
            // 2. CUSTOMER TRANSACTIONS
            // =========================
            } else if (party_type === 'customer') {
                const custCheck = await client.query('SELECT id, name, receivable_balance FROM customers WHERE id = $1', [party_id]);
                if (!custCheck.rows.length) {
                    await client.query('ROLLBACK');
                    return res.status(404).json({ success: false, message: 'Customer not found.' });
                }
                const customer = custCheck.rows[0];

                if (action_type === 'due_payment' || action_type === 'due' || action_type === 'due_receive') {
                    // Customer pays due: Inflow to shop account, decreases customer receivable balance
                    await client.query('UPDATE customers SET receivable_balance = receivable_balance - $1 WHERE id = $2', [numAmount, party_id]);
                    await recordAccountTransaction(client, {
                        accountId: account_id,
                        transactionType: 'credit',
                        type: 'due_receive',
                        amount: numAmount,
                        sourceType: 'due_collection',
                        sourceId: party_id,
                        reference: `Customer: ${customer.name} (#${party_id})`,
                        note: note || 'Due Collection',
                    });

                    // Settle customer's pending unpaid/partial sales invoices FIFO
                    const accNameRes = await client.query('SELECT name FROM payment_accounts WHERE id = $1', [account_id]);
                    const accName = accNameRes.rows[0]?.name || 'Cash';

                    const pendingSales = await client.query(
                        `SELECT id, invoice_no, total_amount, paid_amount, due_amount, payment_status, payment_details
                         FROM sales
                         WHERE customer_id = $1 AND due_amount > 0 AND deleted_at IS NULL
                         ORDER BY created_at ASC, id ASC
                         FOR UPDATE`,
                        [party_id]
                    );

                    let remToAllocate = numAmount;
                    for (const s of pendingSales.rows) {
                        if (remToAllocate <= 0) break;
                        const sDue = Number(s.due_amount || 0);
                        const alloc = Math.min(remToAllocate, sDue);
                        const sPaid = Number(s.paid_amount || 0) + alloc;
                        const sNewDue = Math.max(0, sDue - alloc);
                        const sStatus = sNewDue <= 0 ? 'paid' : 'partial';

                        let pDetails = [];
                        try {
                            if (Array.isArray(s.payment_details)) pDetails = s.payment_details;
                            else if (typeof s.payment_details === 'string') pDetails = JSON.parse(s.payment_details);
                        } catch {
                            pDetails = [];
                        }

                        pDetails.push({
                            date: new Date().toISOString(),
                            amount: alloc,
                            account_id: account_id,
                            account_name: accName,
                            payment_mode: accName,
                            note: note || 'Due Received via Profile Modal',
                        });

                        await client.query(
                            `UPDATE sales
                             SET paid_amount = $1,
                                 due_amount = $2,
                                 payment_status = $3,
                                 payment_details = $4
                             WHERE id = $5`,
                            [sPaid, sNewDue, sStatus, JSON.stringify(pDetails), s.id]
                        );

                        await client.query(
                            `INSERT INTO payments (sale_id, payment_mode, account_name, amount, created_at)
                             VALUES ($1, $2, $3, $4, NOW())`,
                            [s.id, accName, accName, alloc]
                        ).catch(() => {});

                        remToAllocate -= alloc;
                    }

                } else if (action_type === 'advance_receive' || action_type === 'advance' || action_type === 'deposit') {
                    // Customer advance = wallet deposit: Inflow to shop account, customer wallet credited.
                    // Receivable balance is NOT changed — wallet credit is independent of invoice dues.
                    await recordAccountTransaction(client, {
                        accountId: account_id,
                        transactionType: 'credit',
                        type: 'advance_receive',
                        amount: numAmount,
                        sourceType: 'wallet_deposit',
                        sourceId: party_id,
                        reference: `Customer: ${customer.name} (#${party_id})`,
                        note: note || 'Customer Advance',
                    });

                    // Customer advance = wallet deposit: credit the customer's spendable wallet balance
                    await ensureWalletSchema();
                    const custWalletRes = await client.query('SELECT wallet_balance FROM customers WHERE id = $1', [party_id]);
                    const custWallet = parseFloat(custWalletRes.rows[0]?.wallet_balance || 0) || 0;
                    await client.query('UPDATE customers SET wallet_balance = COALESCE(wallet_balance, 0) + $1 WHERE id = $2', [numAmount, party_id]);
                    await writeWalletLedger(client, {
                        party_type: 'customer', party_id: Number(party_id), party_name: customer.name,
                        type: 'advance_deposit', amount: numAmount, credit: true,
                        account_id, account_name: null, account_effect: 'in', cash_drawer_effect: 'in',
                        reference: null, note: (note && note !== 'Customer Advance') ? note : 'Customer advance deposit into wallet',
                        balance_before: custWallet, balance_after: custWallet + numAmount,
                    });

                } else if (action_type === 'refund' || action_type === 'withdraw') {
                    // Refund to customer: Outflow from shop account; wallet credit settles the payout.
                    // Receivable balance is NOT changed — simple wallet/account payout.
                    await recordAccountTransaction(client, {
                        accountId: account_id,
                        transactionType: 'debit',
                        type: 'refund',
                        amount: numAmount,
                        sourceType: 'wallet_withdrawal',
                        sourceId: party_id,
                        reference: `Customer: ${customer.name} (#${party_id})`,
                        note: note || 'Customer Refund',
                    });

                    // Debit the customer's wallet credit (refund settled against spendable balance)
                    await ensureWalletSchema();
                    const refundWalletRes = await client.query('SELECT wallet_balance FROM customers WHERE id = $1', [party_id]);
                    const refundWallet = parseFloat(refundWalletRes.rows[0]?.wallet_balance || 0) || 0;
                    const refundFromWallet = Math.min(numAmount, refundWallet);
                    if (refundFromWallet > 0) {
                        await client.query(
                            'UPDATE customers SET wallet_balance = GREATEST(0, COALESCE(wallet_balance, 0) - $1) WHERE id = $2',
                            [refundFromWallet, party_id]
                        );
                        await writeWalletLedger(client, {
                            party_type: 'customer', party_id: Number(party_id), party_name: customer.name,
                            type: 'refund_payout', amount: refundFromWallet, credit: false,
                            account_id, account_name: null, account_effect: 'out', cash_drawer_effect: 'out',
                            reference: null, note: note || 'Refund payout against wallet credit',
                            balance_before: refundWallet, balance_after: refundWallet - refundFromWallet,
                        });
                    }

                } else {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ success: false, message: 'Invalid customer action.' });
                }

            // =========================
            // 3. STAFF TRANSACTIONS
            // =========================
            } else if (party_type === 'staff') {
                const staffCheck = await client.query('SELECT id, name FROM users WHERE id = $1', [party_id]);
                if (!staffCheck.rows.length) {
                    await client.query('ROLLBACK');
                    return res.status(404).json({ success: false, message: 'Staff member not found.' });
                }
                const staff = staffCheck.rows[0];

                if (action_type === 'salary_payment' || action_type === 'salary' || action_type === 'due_payment') {
                    await recordAccountTransaction(client, {
                        accountId: account_id,
                        transactionType: 'debit',
                        type: 'expense',
                        amount: numAmount,
                        sourceType: 'salary',
                        sourceId: party_id,
                        reference: `Staff: ${staff.name} (#${party_id})`,
                        note: note || 'Staff Remuneration',
                    });
                } else {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ success: false, message: 'Staff members only support Salary or Advance payment.' });
                }

            } else {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'Unknown party type.' });
            }

        // =========================
        // 4. WALLET-TO-WALLET TRANSFER (INTERNAL SHOP)
        // =========================
        } else if (action_type === 'transfer') {
            if (!account_id || !to_account_id) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'Please select both source and destination accounts.' });
            }
            if (account_id === to_account_id) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'Source and destination accounts cannot be identical.' });
            }
            const srcRes = await client.query('SELECT id, name, balance FROM payment_accounts WHERE id = $1', [account_id]);
            if (!srcRes.rows.length || parseFloat(srcRes.rows[0].balance) < numAmount) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'Source account has insufficient balance.' });
            }

            const destRes = await client.query('SELECT id, name, balance FROM payment_accounts WHERE id = $1', [to_account_id]);
            const destName = destRes.rows[0]?.name || `Account #${to_account_id}`;
            const srcName = srcRes.rows[0]?.name || `Account #${account_id}`;

            const partyNote = party_type && party_id ? ` (Party: ${party_type} #${party_id})` : '';

            await recordAccountTransaction(client, {
                accountId: account_id,
                transactionType: 'debit',
                type: 'transfer_out',
                amount: numAmount,
                sourceType: 'transfer',
                sourceId: to_account_id,
                reference: `Transfer to ${destName}${partyNote}`,
                note: note || 'Fund Transfer Out',
            });

            await recordAccountTransaction(client, {
                accountId: to_account_id,
                transactionType: 'credit',
                type: 'transfer_in',
                amount: numAmount,
                sourceType: 'transfer',
                sourceId: account_id,
                reference: `Transfer from ${srcName}${partyNote}`,
                note: note || 'Fund Transfer In',
            });
        }

        await client.query('COMMIT');
        return res.status(200).json({
            success: true,
            message: 'Transaction completed successfully.'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('handlePartyTransaction error:', error);
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};
