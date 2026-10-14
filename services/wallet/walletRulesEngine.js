const { ensureWalletSchema } = require('./walletSchema');
const { money, normalizeEntityType, partyInfo, getOrCreateWallet } = require('./walletEntityHelpers');
const { accountEffect, logAccountTxn, drawerLedgerOnly } = require('./walletLedgerHelpers');

// Central transaction execution engine handling all entity-specific balance rules & atomic transactions
const executeWalletTransaction = async (client, opts) => {
    const {
        entityType, entityId, action,
        amount: rawAmount, accountId,
        referenceType, referenceId, reference = referenceId,
        note, allowOverdraft = false,
    } = opts;

    const amount = money(rawAmount);
    if (amount <= 0) throw new Error('Transaction amount must be greater than zero.');

    const normType = normalizeEntityType(entityType);
    const info = partyInfo(normType);
    if (!info) throw new Error(`Invalid entity type "${entityType}". Must be customer, supplier, or staff.`);

    await ensureWalletSchema(client);
    const wallet = await getOrCreateWallet(client, normType, entityId);
    const currentBalance = money(wallet.balance);

    const checkOverdraft = (requiredAmt) => {
        if (!allowOverdraft && currentBalance < requiredAmt) {
            throw new Error(`Insufficient wallet balance. Available: ৳ ${currentBalance.toFixed(2)}, Required: ৳ ${requiredAmt.toFixed(2)}`);
        }
    };

    let newBalance = currentBalance;
    let credit = false;
    let accInfo = null;
    let effectiveRefType = referenceType || action;
    let txType = action;
    let effectiveAmount = amount;

    // --- A. CUSTOMER WALLET RULES ---
    if (normType === 'customer') {
        if (action === 'topup' || action === 'deposit') {
            // Physical inflow: (+) Cash Drawer / Bank, (+) Customer Wallet
            accInfo = await accountEffect(client, accountId, amount, 'in');
            newBalance = currentBalance + amount;
            credit = true;
            txType = 'deposit';
            effectiveRefType = referenceType || 'topup';
            if (accountId) {
                await logAccountTxn(client, accountId, 'deposit', amount, reference, note || 'Customer wallet top-up / deposit', {
                    sourceType: 'wallet_deposit', sourceId: entityId, transactionId: opts.transactionId
                });
            }
        } else if (action === 'checkout' || action === 'pos_sale' || action === 'sale_payment') {
            // Internal POS payment: Drawer UNCHANGED, (-) Customer Wallet
            checkOverdraft(amount);
            newBalance = currentBalance - amount;
            credit = false;
            txType = 'sale_payment';
            effectiveRefType = referenceType || 'pos_sale';
            await drawerLedgerOnly(client, 'wallet_settlement', amount, reference, note || `POS sale purchase paid from wallet (invoice #${reference || 'N/A'})`, {
                sourceType: 'pos_sale', sourceId: reference
            });
        } else if (action === 'due_settle' || action === 'due_payment') {
            // Settle customer due: Drawer UNCHANGED, (-) Customer Wallet, (-) Customer Due
            checkOverdraft(amount);
            const dueRes = await client.query('SELECT COALESCE(receivable_balance, 0) AS rb FROM customers WHERE id = $1', [Number(entityId)]);
            const dueAmt = money(dueRes.rows[0]?.rb || 0);
            const settle = Math.min(amount, Math.max(0, dueAmt));
            if (settle <= 0) throw new Error(`Customer #${entityId} has no outstanding receivable due to settle.`);
            newBalance = currentBalance - settle;
            effectiveAmount = settle;
            credit = false;
            txType = 'due_payment';
            effectiveRefType = referenceType || 'due_settlement';
            await client.query('UPDATE customers SET receivable_balance = GREATEST(0, COALESCE(receivable_balance, 0) - $1) WHERE id = $2', [settle, Number(entityId)]);
            await drawerLedgerOnly(client, 'wallet_settlement', settle, reference, note || `Customer due paid from wallet (৳${settle})`, {
                sourceType: 'due_collection', sourceId: entityId
            });
        } else if (action === 'withdraw' || action === 'refund' || action === 'withdrawal') {
            // Physical outflow: (-) Cash Drawer / Bank, (-) Customer Wallet
            checkOverdraft(amount);
            accInfo = await accountEffect(client, accountId, amount, 'out');
            newBalance = currentBalance - amount;
            credit = false;
            txType = 'withdraw';
            effectiveRefType = referenceType || 'withdrawal';
            if (accountId) {
                await logAccountTxn(client, accountId, 'withdraw', amount, reference, note || 'Customer wallet refund / payout', {
                    sourceType: 'wallet_withdrawal', sourceId: entityId, transactionId: opts.transactionId
                });
            }
        } else {
            throw new Error(`Unsupported customer wallet action "${action}".`);
        }

    // --- B. SUPPLIER WALLET RULES ---
    } else if (normType === 'supplier') {
        if (action === 'advance_paid' || action === 'deposit' || action === 'advance') {
            // Shop pays advance to supplier: (-) Cash Drawer / Bank, (+) Supplier Advance Wallet
            if (accountId) {
                accInfo = await accountEffect(client, accountId, amount, 'out');
                await logAccountTxn(client, accountId, 'due_payment', amount, reference, note || 'Advance paid to supplier', {
                    sourceType: 'supplier_advance', sourceId: entityId, transactionId: opts.transactionId
                });
            }
            newBalance = currentBalance + amount;
            credit = true;
            txType = 'advance_deposit';
            effectiveRefType = referenceType || 'advance_paid';
        } else if (action === 'purchase_settle' || action === 'purchase_payment') {
            // Purchase bill paid from advance wallet: Drawer UNCHANGED, (-) Supplier Wallet
            checkOverdraft(amount);
            newBalance = currentBalance - amount;
            credit = false;
            txType = 'purchase_payment';
            effectiveRefType = referenceType || 'purchase_settle';
            await drawerLedgerOnly(client, 'wallet_settlement', amount, reference, note || `Purchase settled from supplier wallet (PO #${reference || 'N/A'})`, {
                sourceType: 'purchase', sourceId: reference
            });
        } else if (action === 'supplier_refund' || action === 'withdraw' || action === 'cash_back') {
            // Supplier returns excess advance cash: (+) Cash Drawer / Bank, (-) Supplier Wallet
            checkOverdraft(amount);
            if (accountId) {
                accInfo = await accountEffect(client, accountId, amount, 'in');
                await logAccountTxn(client, accountId, 'deposit', amount, reference, note || 'Supplier excess advance refund returned to shop', {
                    sourceType: 'supplier_refund', sourceId: entityId, transactionId: opts.transactionId
                });
            }
            newBalance = currentBalance - amount;
            credit = false;
            txType = 'withdraw';
            effectiveRefType = referenceType || 'supplier_refund';
        } else if (action === 'due_payment') {
            // Pay payable due from shop account
            checkOverdraft(amount);
            if (!accountId) throw new Error('Pay Due requires a shop account (Cash / Bank / MFS).');
            const payRes = await client.query('SELECT COALESCE(payable_balance, 0) AS pb FROM suppliers WHERE id = $1', [Number(entityId)]);
            const payAmt = money(payRes.rows[0]?.pb || 0);
            const settle = Math.min(amount, Math.max(0, payAmt));
            if (settle <= 0) throw new Error(`Supplier #${entityId} has no payable due to settle.`);
            accInfo = await accountEffect(client, accountId, settle, 'out');
            newBalance = currentBalance - settle;
            effectiveAmount = settle;
            credit = false;
            txType = 'due_payment';
            effectiveRefType = referenceType || 'due_payment';
            await client.query('UPDATE suppliers SET payable_balance = GREATEST(0, COALESCE(payable_balance, 0) - $1) WHERE id = $2', [settle, Number(entityId)]);
            await logAccountTxn(client, accountId, 'due_payment', settle, reference, note || `Supplier due paid from wallet (৳${settle})`, {
                sourceType: 'supplier_payment', sourceId: entityId, transactionId: opts.transactionId
            });
        } else {
            throw new Error(`Unsupported supplier wallet action "${action}".`);
        }

    // --- C. STAFF WALLET RULES ---
    } else if (normType === 'staff') {
        if (action === 'topup' || action === 'deposit') {
            // Staff deposits cash: (+) Cash Drawer / Bank, (+) Staff Wallet
            accInfo = await accountEffect(client, accountId, amount, 'in');
            newBalance = currentBalance + amount;
            credit = true;
            txType = 'deposit';
            effectiveRefType = referenceType || 'topup';
            if (accountId) {
                await logAccountTxn(client, accountId, 'deposit', amount, reference, note || 'Staff wallet deposit', {
                    sourceType: 'wallet_deposit', sourceId: entityId, transactionId: opts.transactionId
                });
            }
        } else if (action === 'salary_accrual' || action === 'salary' || action === 'bonus' || action === 'commission') {
            // Salary / commission approved: Drawer UNCHANGED (ledger only), (+) Staff Wallet
            if (accountId) {
                const accRes = await client.query('SELECT id, name, account_type FROM payment_accounts WHERE id = $1', [accountId]);
                if (accRes.rows.length && accRes.rows[0].account_type !== 'drawer') {
                    accInfo = await accountEffect(client, accountId, amount, 'out');
                    await logAccountTxn(client, accountId, 'expense', amount, reference, note || `Staff ${action} paid from ${accRes.rows[0].name}`, {
                        sourceType: 'salary', sourceId: entityId, transactionId: opts.transactionId
                    });
                } else {
                    await drawerLedgerOnly(client, action === 'salary' ? 'salary_provision' : 'bonus_provision', amount, reference, note || 'Staff wallet credit (drawer unchanged)', {
                        sourceType: 'salary', sourceId: entityId
                    });
                }
            } else {
                await drawerLedgerOnly(client, action === 'salary' ? 'salary_provision' : 'bonus_provision', amount, reference, note || 'Staff wallet credit (drawer unchanged)', {
                    sourceType: 'salary', sourceId: entityId
                });
            }
            newBalance = currentBalance + amount;
            credit = true;
            txType = action;
            effectiveRefType = referenceType || 'salary_accrual';
        } else if (action === 'internal_purchase' || action === 'purchase') {
            // Staff buys items with wallet: Drawer UNCHANGED, (-) Staff Wallet
            checkOverdraft(amount);
            newBalance = currentBalance - amount;
            credit = false;
            txType = 'internal_purchase';
            effectiveRefType = referenceType || 'internal_purchase';
            await drawerLedgerOnly(client, 'wallet_settlement', amount, reference, note || 'Staff internal purchase paid from wallet', {
                sourceType: 'internal_purchase', sourceId: entityId
            });
        } else if (action === 'withdraw' || action === 'payout' || action === 'withdrawal') {
            // Staff withdraws cash: (-) Cash Drawer / Bank, (-) Staff Wallet
            checkOverdraft(amount);
            accInfo = await accountEffect(client, accountId, amount, 'out');
            newBalance = currentBalance - amount;
            credit = false;
            txType = 'withdraw';
            effectiveRefType = referenceType || 'withdrawal';
            if (accountId) {
                await logAccountTxn(client, accountId, 'withdraw', amount, reference, note || 'Staff wallet withdrawal / cash payout', {
                    sourceType: 'wallet_withdrawal', sourceId: entityId, transactionId: opts.transactionId
                });
            }
        } else {
            throw new Error(`Unsupported staff wallet action "${action}".`);
        }
    }

    // Update centralized wallets table
    await client.query(
        'UPDATE wallets SET balance = $1, updated_at = NOW() WHERE id = $2',
        [newBalance, wallet.id]
    );

    // Update entity table for backwards compatibility
    await client.query(
        `UPDATE ${info.table} SET ${info.balanceCol} = $1 WHERE ${info.idCol} = $2`,
        [newBalance, Number(entityId)]
    );

    // Insert wallet_transactions entry
    const txInsertRes = await client.query(
        `INSERT INTO wallet_transactions (
            wallet_id, entity_type, entity_id, entity_name,
            party_type, party_id, party_name,
            type, amount, credit,
            account_id, account_name, account_effect, cash_drawer_effect,
            reference_type, reference_id, reference, note,
            balance_before, balance_after, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW())
         RETURNING *`,
        [
            wallet.id, normType, Number(entityId), wallet.entity_name,
            normType, Number(entityId), wallet.entity_name,
            txType, effectiveAmount, credit,
            accInfo?.id || accountId || null,
            accInfo?.name || null,
            accInfo?.effect || 'none',
            accInfo?.drawer || 'none',
            effectiveRefType, referenceId || reference, reference,
            note || null,
            currentBalance, newBalance,
        ]
    );

    return {
        wallet: { ...wallet, balance: newBalance },
        transaction: txInsertRes.rows[0],
    };
};

module.exports = {
    executeWalletTransaction,
};
