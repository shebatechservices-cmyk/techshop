const { money, normalizeEntityType, getOrCreateWallet } = require('./walletEntityHelpers');

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

module.exports = {
    accountEffect,
    logAccountTxn,
    drawerLedgerOnly,
    writeWalletLedger,
};
