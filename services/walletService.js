const pool = require('../config/db');

const money = (val) => Number.parseFloat(val || 0) || 0;

let walletMigrated = false;

const ensureWalletSchema = async (dbClient = pool) => {
    if (walletMigrated) return;
    try {
        await dbClient.query(`
            ALTER TABLE customers ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(14,2) DEFAULT 0;
            ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(14,2) DEFAULT 0;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(14,2) DEFAULT 0;

            CREATE TABLE IF NOT EXISTS wallets (
                id SERIAL PRIMARY KEY,
                entity_type VARCHAR(20) NOT NULL,
                entity_id INTEGER NOT NULL,
                entity_name VARCHAR(150),
                balance NUMERIC(14,2) NOT NULL DEFAULT 0,
                status VARCHAR(20) NOT NULL DEFAULT 'active',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                deleted_at TIMESTAMP,
                CONSTRAINT uq_entity_wallet UNIQUE (entity_type, entity_id)
            );

            CREATE TABLE IF NOT EXISTS wallet_transactions (
                id SERIAL PRIMARY KEY,
                wallet_id INTEGER REFERENCES wallets(id) ON DELETE SET NULL,
                entity_type VARCHAR(20),
                entity_id INTEGER,
                entity_name VARCHAR(150),
                party_type VARCHAR(20),
                party_id INTEGER,
                party_name VARCHAR(150),
                type VARCHAR(30) NOT NULL,
                amount NUMERIC(14,2) NOT NULL,
                credit BOOLEAN NOT NULL DEFAULT true,
                balance_before NUMERIC(14,2) DEFAULT 0,
                balance_after NUMERIC(14,2) DEFAULT 0,
                reference_type VARCHAR(50),
                reference_id VARCHAR(120),
                reference VARCHAR(120),
                account_id INTEGER,
                account_name VARCHAR(100),
                account_effect VARCHAR(10) NOT NULL DEFAULT 'none',
                cash_drawer_effect VARCHAR(10) NOT NULL DEFAULT 'none',
                note TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                deleted_at TIMESTAMP
            );

            ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS wallet_id INTEGER;
            ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS entity_type VARCHAR(20);
            ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS entity_id INTEGER;
            ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS entity_name VARCHAR(150);
            ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50);
            ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS reference_id VARCHAR(120);
            ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
        `);

        // Populate / sync wallets table from entity tables safely
        await dbClient.query(`
            INSERT INTO wallets (entity_type, entity_id, entity_name, balance, created_at, updated_at)
            SELECT 'customer', id, name, COALESCE(wallet_balance, 0), NOW(), NOW()
            FROM customers
            ON CONFLICT (entity_type, entity_id) DO UPDATE
            SET balance = EXCLUDED.balance, entity_name = EXCLUDED.entity_name;

            INSERT INTO wallets (entity_type, entity_id, entity_name, balance, created_at, updated_at)
            SELECT 'supplier', id, name, COALESCE(wallet_balance, 0), NOW(), NOW()
            FROM suppliers
            ON CONFLICT (entity_type, entity_id) DO UPDATE
            SET balance = EXCLUDED.balance, entity_name = EXCLUDED.entity_name;

            INSERT INTO wallets (entity_type, entity_id, entity_name, balance, created_at, updated_at)
            SELECT 'staff', id, name, COALESCE(wallet_balance, 0), NOW(), NOW()
            FROM users
            ON CONFLICT (entity_type, entity_id) DO UPDATE
            SET balance = EXCLUDED.balance, entity_name = EXCLUDED.entity_name;
        `).catch(() => null);

        walletMigrated = true;
    } catch (e) {
        console.warn('Wallet schema migration notice:', e.message);
    }
};

// Run eagerly so DDL is completed on startup
ensureWalletSchema().catch(() => {});

const normalizeEntityType = (type) => {
    const t = String(type || '').trim().toLowerCase();
    if (t === 'customer' || t === 'customers') return 'customer';
    if (t === 'supplier' || t === 'suppliers') return 'supplier';
    if (t === 'staff' || t === 'user' || t === 'users' || t === 'employee') return 'staff';
    return null;
};

const partyInfo = (type) => {
    const t = normalizeEntityType(type);
    if (t === 'customer') return { entityType: 'customer', table: 'customers', idCol: 'id', nameCol: 'name', balanceCol: 'wallet_balance' };
    if (t === 'supplier') return { entityType: 'supplier', table: 'suppliers', idCol: 'id', nameCol: 'name', balanceCol: 'wallet_balance' };
    if (t === 'staff') return { entityType: 'staff', table: 'users', idCol: 'id', nameCol: 'name', balanceCol: 'wallet_balance' };
    return null;
};

// Sign: 'in' = account balance increases, 'out' = account balance decreases
const accountEffect = async (client, accountId, amount, sign) => {
    if (!accountId) throw new Error('Please select a shop account (Cash / Bank / MFS).');
    const accRes = await client.query('SELECT id, name, account_type, balance FROM payment_accounts WHERE id = $1', [accountId]);
    if (!accRes.rows.length) throw new Error('Selected shop account was not found.');
    const acc = accRes.rows[0];
    if (sign === 'in') {
        await client.query('UPDATE payment_accounts SET balance = balance + $1 WHERE id = $2', [amount, accountId]);
        await client.query('UPDATE accounts SET current_balance = COALESCE(current_balance, 0) + $1 WHERE LOWER(account_name) = LOWER($2)', [amount, acc.name]).catch(() => null);
    } else {
        if (money(acc.balance) < amount) throw new Error(`Insufficient balance in ${acc.name}. Available: ৳ ${money(acc.balance)}`);
        await client.query('UPDATE payment_accounts SET balance = GREATEST(0, balance - $1) WHERE id = $2', [amount, accountId]);
        await client.query('UPDATE accounts SET current_balance = GREATEST(0, COALESCE(current_balance, 0) - $1) WHERE LOWER(account_name) = LOWER($2)', [amount, acc.name]).catch(() => null);
    }
    return {
        id: acc.id,
        name: acc.name,
        effect: sign,
        drawer: (acc.account_type === 'drawer' || String(acc.name).toLowerCase().includes('drawer')) ? sign : 'none',
    };
};

// Writes an account_transactions row on the account whose balance actually moved (double-entry audit)
const logAccountTxn = async (client, accountId, type, amount, reference, note, extra = {}) => {
    if (!accountId || !amount || money(amount) <= 0) return;
    try {
        await client.query(`
            ALTER TABLE account_transactions ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(20);
            ALTER TABLE account_transactions ADD COLUMN IF NOT EXISTS balance_after NUMERIC(14,2);
            ALTER TABLE account_transactions ADD COLUMN IF NOT EXISTS source_type VARCHAR(50);
            ALTER TABLE account_transactions ADD COLUMN IF NOT EXISTS source_id VARCHAR(100);
            ALTER TABLE account_transactions ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
            ALTER TABLE account_transactions ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(120);
        `).catch(() => null);

        const accRes = await client.query('SELECT balance FROM payment_accounts WHERE id = $1', [accountId]);
        const balanceAfter = accRes.rows.length ? money(accRes.rows[0].balance) : null;

        const isCredit = ['deposit', 'due_receive', 'advance_receive', 'transfer_in', 'credit', 'in'].includes(type);
        const transactionType = extra.transactionType || (isCredit ? 'credit' : 'debit');
        const sourceType = extra.sourceType || (isCredit ? 'wallet_deposit' : 'wallet_withdrawal');

        await client.query(
            `INSERT INTO account_transactions (
                account_id, type, amount, reference, note,
                transaction_type, balance_after, source_type, source_id, transaction_id, created_by, created_at
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
            [
                accountId, type, money(amount), reference || null, note || null,
                transactionType, balanceAfter, sourceType, extra.sourceId ? String(extra.sourceId) : null,
                extra.transactionId || null, extra.createdBy || null
            ]
        );
    } catch (err) {
        console.warn('logAccountTxn warning:', err.message);
    }
};

// Writes an account_transactions row ONLY (no balance change) — for internal wallet settlements that do not move the physical cash drawer
const drawerLedgerOnly = async (client, type, amount, reference, note, extra = {}) => {
    try {
        const d = await client.query("SELECT id, balance FROM payment_accounts WHERE account_type = 'drawer' OR id = 1 ORDER BY (account_type = 'drawer') DESC, id ASC LIMIT 1");
        if (d.rows.length) {
            const drawerId = d.rows[0].id;
            const balanceAfter = money(d.rows[0].balance);
            await client.query(
                `INSERT INTO account_transactions (
                    account_id, type, amount, reference, note,
                    transaction_type, balance_after, source_type, source_id, created_at
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
                [
                    drawerId, type, money(amount), reference || null, note || 'Internal wallet settlement (drawer unchanged)',
                    'ledger_only', balanceAfter, extra.sourceType || 'wallet_settlement', extra.sourceId ? String(extra.sourceId) : null
                ]
            ).catch((err) => console.warn('drawer ledger warning:', err.message));
        }
    } catch (_) {}
};

// Get or lazily provision centralized wallet for an entity
const getOrCreateWallet = async (client, entityType, entityId) => {
    const info = partyInfo(entityType);
    if (!info) throw new Error(`Invalid entity type "${entityType}". Must be customer, supplier, or staff.`);

    let walletRes = await client.query(
        'SELECT * FROM wallets WHERE entity_type = $1 AND entity_id = $2',
        [info.entityType, Number(entityId)]
    );

    if (walletRes.rows.length > 0) {
        return walletRes.rows[0];
    }

    // Provision from underlying party table
    const partyRes = await client.query(
        `SELECT ${info.idCol} AS id, ${info.nameCol} AS name, COALESCE(${info.balanceCol}, 0) AS balance FROM ${info.table} WHERE ${info.idCol} = $1`,
        [Number(entityId)]
    );
    if (!partyRes.rows.length) {
        throw new Error(`${info.entityType.charAt(0).toUpperCase() + info.entityType.slice(1)} #${entityId} not found.`);
    }

    const party = partyRes.rows[0];
    const initialBal = money(party.balance);

    const insertRes = await client.query(
        `INSERT INTO wallets (entity_type, entity_id, entity_name, balance, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'active', NOW(), NOW())
         ON CONFLICT (entity_type, entity_id) DO UPDATE SET balance = EXCLUDED.balance, entity_name = EXCLUDED.entity_name
         RETURNING *`,
        [info.entityType, Number(entityId), party.name || null, initialBal]
    );

    return insertRes.rows[0];
};

// Reusable helper for recording ledger entries inside existing DB transactions (100% backward compatible)
const writeWalletLedger = async (client, ledger) => {
    const {
        party_type, entity_type = party_type,
        party_id, entity_id = party_id,
        party_name = null, entity_name = party_name,
        type, amount, credit,
        account_id = null, account_name = null,
        account_effect = 'none', cash_drawer_effect = 'none',
        reference = null, reference_id = reference,
        reference_type = null,
        note = null,
        balance_before, balance_after,
    } = ledger;

    const normType = normalizeEntityType(entity_type);
    let walletId = ledger.wallet_id || null;

    if (!walletId && normType && entity_id) {
        try {
            const w = await getOrCreateWallet(client, normType, entity_id);
            walletId = w ? w.id : null;
        } catch (_) {}
    }

    // Keep wallets table balance synced
    if (walletId && balance_after !== undefined) {
        await client.query(
            'UPDATE wallets SET balance = $1, updated_at = NOW() WHERE id = $2',
            [money(balance_after), walletId]
        ).catch(() => null);
    }

    // Insert into wallet_transactions
    await client.query(
        `INSERT INTO wallet_transactions (
            wallet_id, entity_type, entity_id, entity_name,
            party_type, party_id, party_name,
            type, amount, credit,
            account_id, account_name, account_effect, cash_drawer_effect,
            reference_type, reference_id, reference, note,
            balance_before, balance_after, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW())`,
        [
            walletId, normType || entity_type, Number(entity_id), entity_name,
            normType || party_type, Number(party_id), party_name,
            type, money(amount), credit,
            account_id, account_name, account_effect, cash_drawer_effect,
            reference_type || type, reference_id, reference, note,
            money(balance_before), money(balance_after),
        ]
    );
};

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
    ensureWalletSchema,
    normalizeEntityType,
    partyInfo,
    accountEffect,
    logAccountTxn,
    drawerLedgerOnly,
    getOrCreateWallet,
    writeWalletLedger,
    executeWalletTransaction,
    money,
};
