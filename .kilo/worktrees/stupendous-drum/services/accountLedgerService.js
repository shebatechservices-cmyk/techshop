const pool = require('../config/db');

const money = (val) => Number.parseFloat(val || 0) || 0;

let ledgerMigrated = false;

const ensureAccountLedgerSchema = async (dbClient = pool) => {
    if (ledgerMigrated) return;
    try {
        await dbClient.query(`
            ALTER TABLE account_transactions ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(20);
            ALTER TABLE account_transactions ADD COLUMN IF NOT EXISTS balance_after NUMERIC(14,2);
            ALTER TABLE account_transactions ADD COLUMN IF NOT EXISTS source_type VARCHAR(50);
            ALTER TABLE account_transactions ADD COLUMN IF NOT EXISTS source_id VARCHAR(100);
            ALTER TABLE account_transactions ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
            ALTER TABLE account_transactions ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(120);
            ALTER TABLE payment_accounts ADD COLUMN IF NOT EXISTS account_number VARCHAR(100);
            ALTER TABLE payment_accounts ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
            ALTER TABLE accounts ADD COLUMN IF NOT EXISTS current_balance NUMERIC(14,2) DEFAULT 0;
        `);
        ledgerMigrated = true;
    } catch (e) {
        console.warn('ensureAccountLedgerSchema notice:', e.message);
    }
};

/**
 * Atomically records an immutable ledger entry in `account_transactions` and
 * updates the running balance in `payment_accounts` (and mirrors `accounts` table).
 *
 * @param {object} client - pg client (inside an active BEGIN/COMMIT transaction)
 * @param {object} opts
 * @param {number} opts.accountId - Target payment account ID
 * @param {'credit'|'debit'} opts.transactionType - 'credit' (Inflow / Cash-In) or 'debit' (Outflow / Cash-Out)
 * @param {number} opts.amount - Monetary amount (> 0)
 * @param {string} [opts.type] - Backwards-compatible type identifier (deposit, withdraw, refund, expense, etc.)
 * @param {string} [opts.sourceType] - Transaction origin (pos_sale, purchase, wallet_deposit, wallet_withdrawal, due_collection, supplier_payment, expense, transfer, opening_balance, etc.)
 * @param {string|number} [opts.sourceId] - Triggering entity/invoice/PO/voucher ID
 * @param {string} [opts.reference] - Human-readable reference string
 * @param {string} [opts.note] - Descriptive note or narrative
 * @param {string} [opts.transactionId] - MFS / Bank transaction ID (trxID)
 * @param {string} [opts.createdBy] - Operator or username
 * @param {boolean} [opts.updateBalance=true] - Whether to mutate account balance or just record running balance
 * @returns {Promise<object>} The created account_transaction row with updated account details
 */
const recordAccountTransaction = async (client, opts) => {
    const {
        accountId,
        amount: rawAmount,
        transactionType: rawTxType,
        type: rawType,
        sourceType = 'manual',
        sourceId = null,
        reference = null,
        note = null,
        transactionId = null,
        createdBy = null,
        updateBalance = true,
    } = opts;

    const amount = money(rawAmount);
    if (!accountId || amount <= 0) {
        return null;
    }

    await ensureAccountLedgerSchema(client);

    // Normalize transaction direction ('credit' for cash-in, 'debit' for cash-out)
    let transactionType = String(rawTxType || '').toLowerCase();
    let type = String(rawType || '').toLowerCase();

    if (!transactionType) {
        if (['deposit', 'due_receive', 'advance_receive', 'transfer_in', 'credit', 'in', 'sale_payment', 'sale_revenue'].includes(type)) {
            transactionType = 'credit';
        } else {
            transactionType = 'debit';
        }
    }

    if (!type) {
        type = transactionType === 'credit' ? 'deposit' : 'withdraw';
    }

    // Lock/fetch account row for atomic balance update
    const accRes = await client.query(
        'SELECT id, name, account_type, balance FROM payment_accounts WHERE id = $1',
        [accountId]
    );

    if (!accRes.rows.length) {
        throw new Error(`Payment account #${accountId} not found.`);
    }

    const currentAcc = accRes.rows[0];
    const currentBalance = money(currentAcc.balance);
    let balanceAfter = currentBalance;

    if (updateBalance) {
        if (transactionType === 'credit') {
            balanceAfter = currentBalance + amount;
            await client.query(
                'UPDATE payment_accounts SET balance = balance + $1 WHERE id = $2',
                [amount, accountId]
            );
        } else {
            balanceAfter = Math.max(0, currentBalance - amount);
            await client.query(
                'UPDATE payment_accounts SET balance = GREATEST(0, balance - $1) WHERE id = $2',
                [amount, accountId]
            );
        }

        // Mirror to accounts table if exists
        await client.query(
            'UPDATE accounts SET current_balance = $1 WHERE LOWER(account_name) = LOWER($2)',
            [balanceAfter, currentAcc.name]
        ).catch(() => null);
    }

    // Insert into account_transactions ledger with standard first 5 columns for universal compatibility
    const insertRes = await client.query(
        `INSERT INTO account_transactions (
            account_id,
            type,
            amount,
            reference,
            note,
            transaction_type,
            balance_after,
            source_type,
            source_id,
            transaction_id,
            created_by,
            created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        RETURNING *`,
        [
            accountId,
            type,
            amount,
            reference || null,
            note || null,
            transactionType,
            balanceAfter,
            sourceType,
            sourceId ? String(sourceId) : null,
            transactionId || null,
            createdBy || null,
        ]
    );

    return {
        transaction: insertRes.rows[0],
        account: { ...currentAcc, balance: balanceAfter },
    };
};

module.exports = {
    ensureAccountLedgerSchema,
    recordAccountTransaction,
    money,
};
