const pool = require('../config/db');

const money = (val) => Number.parseFloat(val || 0) || 0;

let walletMigrated = false;
const ensureWalletSchema = async () => {
    if (walletMigrated) return;
    try {
        await pool.query(`
            ALTER TABLE customers ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(14,2) DEFAULT 0;
            ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(14,2) DEFAULT 0;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(14,2) DEFAULT 0;
            CREATE TABLE IF NOT EXISTS wallet_transactions (
                id SERIAL PRIMARY KEY,
                party_type VARCHAR(20) NOT NULL,
                party_id INTEGER NOT NULL,
                party_name VARCHAR(150),
                type VARCHAR(30) NOT NULL,
                amount NUMERIC(14,2) NOT NULL,
                credit BOOLEAN NOT NULL DEFAULT true,
                account_id INTEGER,
                account_name VARCHAR(100),
                account_effect VARCHAR(10) NOT NULL DEFAULT 'none',
                cash_drawer_effect VARCHAR(10) NOT NULL DEFAULT 'none',
                reference VARCHAR(120),
                note TEXT,
                balance_before NUMERIC(14,2) DEFAULT 0,
                balance_after NUMERIC(14,2) DEFAULT 0,
                deleted_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT now()
            );
            ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
        `);
        walletMigrated = true;
    } catch (e) {
        console.warn('Wallet schema migration notice:', e.message);
    }
};

const partyInfo = (type) => {
    if (type === 'customer') return { table: 'customers', idCol: 'id', nameCol: 'name', balanceCol: 'wallet_balance' };
    if (type === 'supplier') return { table: 'suppliers', idCol: 'id', nameCol: 'name', balanceCol: 'wallet_balance' };
    if (type === 'staff') return { table: 'users', idCol: 'id', nameCol: 'name', balanceCol: 'wallet_balance' };
    return null;
};

// Reusable helper for controllers that need a wallet ledger entry inside their own transaction
const writeWalletLedger = async (client, ledger) => {
    const {
        party_type, party_id, party_name = null, type, amount, credit,
        account_id = null, account_name = null, account_effect = 'none',
        cash_drawer_effect = 'none', reference = null, note = null,
        balance_before, balance_after,
    } = ledger;
    await client.query(
        `INSERT INTO wallet_transactions (
            party_type, party_id, party_name, type, amount, credit,
            account_id, account_name, account_effect, cash_drawer_effect,
            reference, note, balance_before, balance_after
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [party_type, party_id, party_name, type, amount, credit, account_id, account_name,
         account_effect, cash_drawer_effect, reference, note, balance_before, balance_after]
    );
};

// Sign: 'in' = account balance increases, 'out' = account balance decreases
const accountEffect = async (client, accountId, amount, sign) => {
    if (!accountId) throw new Error('Please select a shop account (Cash / Bank / MFS).');
    const accRes = await client.query('SELECT id, name, account_type, balance FROM payment_accounts WHERE id = $1', [accountId]);
    if (!accRes.rows.length) throw new Error('Selected shop account was not found.');
    const acc = accRes.rows[0];
    if (sign === 'in') {
        await client.query('UPDATE payment_accounts SET balance = balance + $1 WHERE id = $2', [amount, accountId]);
    } else {
        if (money(acc.balance) < amount) throw new Error(`Insufficient balance in ${acc.name}. Available: ৳ ${money(acc.balance)}`);
        await client.query('UPDATE payment_accounts SET balance = balance - $1 WHERE id = $2', [amount, accountId]);
    }
    return {
        id: acc.id,
        name: acc.name,
        effect: sign,
        drawer: acc.account_type === 'drawer' ? sign : 'none',
    };
};

// Writes an account_transactions row on the SAME account whose balance actually moved (double-entry)
const logAccountTxn = async (client, accountId, type, amount, reference, note) => {
    if (!accountId || !amount || money(amount) <= 0) return;
    await client.query(
        `INSERT INTO account_transactions (account_id, type, amount, reference, note)
         VALUES ($1, $2, $3, $4, $5)`,
        [accountId, type, amount, reference || null, note || null]
    );
};

// Writes an account_transactions row ONLY (no balance change) — for internal wallet settlements that must not move the drawer
const drawerLedgerOnly = async (client, type, amount, reference, note) => {
    const d = await client.query("SELECT id FROM payment_accounts WHERE account_type = 'drawer' OR id = 1 LIMIT 1");
    if (d.rows.length) {
        await client.query(
            `INSERT INTO account_transactions (account_id, type, amount, reference, note)
             VALUES ($1, $2, $3, $4, $5)`,
            [d.rows[0].id, type, amount, reference || null, note || 'Internal wallet settlement (drawer unchanged)']
        ).catch((err) => console.warn('drawer ledger warning:', err.message));
    }
};

// =========================================================
// GET  /api/wallets/:type/:id  → wallet balance + full ledger
// =========================================================
exports.getPartyWallet = async (req, res) => {
    try {
        const { type, id } = req.params;
        const partyId = Number(id);
        const info = partyInfo(type);
        if (!info || !partyId) return res.status(400).json({ success: false, message: 'Invalid party type or ID.' });
        await ensureWalletSchema();

        const partyRes = await pool.query(
            `SELECT ${info.idCol} AS id, ${info.nameCol} AS name, ${info.balanceCol} AS wallet_balance FROM ${info.table} WHERE ${info.idCol} = $1`,
            [partyId]
        );
        if (!partyRes.rows.length) return res.status(404).json({ success: false, message: 'Party not found.' });
        const party = partyRes.rows[0];

        const ledgerRes = await pool.query(
            `SELECT * FROM wallet_transactions WHERE party_type = $1 AND party_id = $2 AND deleted_at IS NULL ORDER BY id DESC LIMIT 200`,
            [type, partyId]
        );

        return res.status(200).json({
            success: true,
            party,
            transactions: ledgerRes.rows,
        });
    } catch (error) {
        console.error('getPartyWallet error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// =========================================================
// POST /api/wallets/transaction
// =========================================================
exports.postWalletTransaction = async (req, res) => {
    const client = await pool.connect();
    try {
        const {
            party_type, party_id, action, amount: rawAmount,
            account_id, note, reference,
        } = req.body;
        const amount = money(rawAmount);
        if (!party_type || !party_id || !action || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Party type, party, action and a positive amount are required.' });
        }

        const info = partyInfo(party_type);
        if (!info) return res.status(400).json({ success: false, message: 'Unknown party type.' });

        await client.query('BEGIN');
        await ensureWalletSchema();

        const partyRes = await client.query(
            `SELECT * FROM ${info.table} WHERE ${info.idCol} = $1`,
            [Number(party_id)]
        );
        if (!partyRes.rows.length) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Party not found.' });
        }
        const party = partyRes.rows[0];
        const partyName = party[info.nameCol];
        const currentbalance = money(party[info.balanceCol]);

        const adjustWallet = async (delta) => {
            const newBalance = currentbalance + delta;
            await client.query(
                `UPDATE ${info.table} SET ${info.balanceCol} = ${info.balanceCol} + $1 WHERE ${info.idCol} = $2`,
                [delta, Number(party_id)]
            );
            return newBalance;
        };

        const ensureWalletSufficient = () => {
            if (amount > currentbalance) {
                throw new Error(`Insufficient wallet balance. Available: ৳ ${currentbalance}`);
            }
        };

        let newBalance = currentbalance;
        let credit = false;
        let accInfo = null;
        let txType = action;
        let effectiveAmount = amount;

        if (party_type === 'customer') {
            if (action === 'deposit') {
                // Customer adds money to wallet → chosen shop account receives money (wallet is independent credit)
                accInfo = await accountEffect(client, account_id, amount, 'in');
                newBalance = await adjustWallet(amount);
                if (account_id) await logAccountTxn(client, account_id, 'deposit', amount, reference, note || 'Customer wallet deposit');
                credit = true;
            } else if (action === 'withdraw' || action === 'refund') {
                // Customer withdraws wallet money → chosen shop account pays out
                ensureWalletSufficient();
                accInfo = await accountEffect(client, account_id, amount, 'out');
                newBalance = await adjustWallet(-amount);
                if (account_id) await logAccountTxn(client, account_id, 'withdraw', amount, reference, note || 'Customer wallet withdrawal');
                credit = false;
            } else if (action === 'due_payment') {
                // Customer settles dues from wallet → internal transfer, drawer unchanged (ledger only).
                // Settle capped at the actual receivable due so wallet, receivable & reversal stay symmetric.
                ensureWalletSufficient();
                const dueRes = await client.query('SELECT COALESCE(receivable_balance, 0) AS rb FROM customers WHERE id = $1', [Number(party_id)]);
                const dueAmt = money(dueRes.rows[0]?.rb || 0);
                const settle = Math.min(amount, Math.max(0, dueAmt));
                if (settle <= 0) throw new Error(`Customer #${party_id} has no receivable due to settle (due: ৳0).`);
                newBalance = await adjustWallet(-settle);
                await client.query('UPDATE customers SET receivable_balance = GREATEST(0, COALESCE(receivable_balance, 0) - $1) WHERE id = $2', [settle, Number(party_id)]);
                await drawerLedgerOnly(client, 'wallet_settlement', settle, reference, note || `Customer due paid from wallet (৳${settle})`);
                effectiveAmount = settle;
                credit = false;
            } else {
                throw new Error('Invalid customer wallet action. Use deposit, withdraw, refund or due_payment.');
            }
        } else if (party_type === 'supplier') {
            if (action === 'deposit') {
                // Supplier wallet deposit: money stays in the shop drawer, just tagged as the supplier's.
                // Drawer & payable balance are UNCHANGED (drawer reservation model).
                newBalance = await adjustWallet(amount);
                credit = true;
            } else if (action === 'withdraw') {
                // Supplier takes money back out of the wallet: wallet drops, drawer & payable unchanged.
                ensureWalletSufficient();
                newBalance = await adjustWallet(-amount);
                credit = false;
            } else if (action === 'due_payment') {
                // Supplier due settled from wallet: real cash leaves the chosen shop account AND wallet drops.
                // Settle capped at the actual payable due so payable & reversal stay symmetric.
                ensureWalletSufficient();
                if (!account_id) throw new Error('Pay Due From Wallet requires a shop account (Cash / Bank / MFS) — the reserved wallet money must leave a real account.');
                const payRes = await client.query('SELECT COALESCE(payable_balance, 0) AS pb FROM suppliers WHERE id = $1', [Number(party_id)]);
                const payAmt = money(payRes.rows[0]?.pb || 0);
                const settle = Math.min(amount, Math.max(0, payAmt));
                if (settle <= 0) throw new Error(`Supplier #${party_id} has no payable due to settle (payable: ৳0).`);
                accInfo = await accountEffect(client, account_id, settle, 'out');
                newBalance = await adjustWallet(-settle);
                await client.query('UPDATE suppliers SET payable_balance = GREATEST(0, COALESCE(payable_balance, 0) - $1) WHERE id = $2', [settle, Number(party_id)]);
                if (account_id) await logAccountTxn(client, account_id, 'due_payment', settle, reference, note || `Supplier due paid from wallet (৳${settle})`);
                effectiveAmount = settle;
                credit = false;
            } else {
                throw new Error('Invalid supplier wallet action. Use deposit, withdraw or due_payment.');
            }
        } else if (party_type === 'staff') {
            if (action === 'salary' || action === 'bonus') {
                // Salary/bonus credited to wallet. Main cash drawer stays fixed (ledger only).
                // If funded from a Bank/MFS account, only that account decreases.
                if (account_id) {
                    const accRes = await client.query('SELECT id, name, account_type FROM payment_accounts WHERE id = $1', [account_id]);
                    if (!accRes.rows.length) throw new Error('Selected shop account was not found.');
                    const acc = accRes.rows[0];
                    if (acc.account_type === 'drawer') {
                        await drawerLedgerOnly(client, action === 'salary' ? 'salary_provision' : 'bonus_provision', amount, reference, note || 'Staff wallet credit (drawer unchanged)');
                        accInfo = { id: acc.id, name: acc.name, effect: 'none', drawer: 'none' };
                    } else {
                        await accountEffect(client, account_id, amount, 'out');
                        await logAccountTxn(client, account_id, 'expense', amount, reference, note || `Staff ${action} paid from ${acc.name}`);
                        accInfo = { id: acc.id, name: acc.name, effect: 'out', drawer: 'none' };
                    }
                } else {
                    await drawerLedgerOnly(client, action === 'salary' ? 'salary_provision' : 'bonus_provision', amount, reference, note || 'Staff wallet credit (drawer unchanged)');
                }
                newBalance = await adjustWallet(amount);
                credit = true;
                txType = action;
            } else if (action === 'withdraw') {
                // Staff withdraws wallet → chosen shop account (usually cash drawer) pays out
                ensureWalletSufficient();
                accInfo = await accountEffect(client, account_id, amount, 'in');
                newBalance = await adjustWallet(-amount);
                if (account_id) await logAccountTxn(client, account_id, 'deposit', amount, reference, note || 'Staff wallet withdrawal');
                credit = false;
            } else {
                throw new Error('Invalid staff wallet action. Use salary, bonus or withdraw.');
            }
        } else {
            throw new Error('Unknown party type.');
        }

        await writeWalletLedger(client, {
            party_type, party_id: Number(party_id), party_name: partyName,
            type: txType, amount: effectiveAmount, credit,
            account_id: accInfo?.id || account_id || null,
            account_name: accInfo?.name || null,
            account_effect: accInfo?.effect || 'none',
            cash_drawer_effect: accInfo?.drawer || 'none',
            reference: reference || null,
            note: note || null,
            balance_before: currentbalance,
            balance_after: newBalance,
        });

        await client.query('COMMIT');
        return res.status(200).json({
            success: true,
            message: 'Wallet transaction completed successfully.',
            data: { balance: newBalance, type: txType, credit },
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('postWalletTransaction error:', error);
        return res.status(400).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};

// Wallet transaction types created automatically by sale/purchase flows — deleting them individually
// would corrupt the sale/PO balances, so manual delete/edit is blocked for these
const SYSTEM_WALLET_TYPES = new Set([
    'sale_payment', 'sale_edit_refund', 'sale_delete_refund',
    'purchase_payment', 'purchase_delete_refund', 'wallet_settlement',
]);

// Applies the PARTY-side effect direction for a given original wallet transaction.
// Returns the signed delta to add to the party's receivable/payable balance, or null when the
// party balance is untouched. Under the drawer-reservation model only due_payment affects the
// party balance (paying a due reduces it); wallet deposits/withdrawals are independent credit.
const partyBalanceDelta = (row, delta) => {
    if (!row || row.party_type === 'staff') return null;
    const table = row.party_type === 'supplier' ? 'payable' : 'receivable';
    const dir = row.type === 'due_payment' ? -1 : 0;
    if (dir === 0) return null;
    return { table, signed: dir * delta };
};

// =========================================================
// DELETE /api/wallets/transaction/:id  → full rollback + ledger history
// =========================================================
exports.deleteWalletTransaction = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        await client.query('BEGIN');
        await ensureWalletSchema();

        const tRes = await client.query('SELECT * FROM wallet_transactions WHERE id = $1 AND deleted_at IS NULL', [id]);
        if (!tRes.rows.length) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Wallet transaction not found or already reversed.' });
        }
        const row = tRes.rows[0];
        if (SYSTEM_WALLET_TYPES.has(row.type)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'This wallet transaction was created by a sale/purchase flow and cannot be deleted individually. Delete the original sale or purchase instead.' });
        }
        const amount = money(row.amount);
        if (amount <= 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'Invalid wallet transaction amount.' });
        }

        const info = partyInfo(row.party_type);
        if (!info) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'Unknown party type on wallet transaction.' });
        }

        // 1. Reverse party wallet_balance
        const pbRes = await client.query(`SELECT ${info.balanceCol} AS wb FROM ${info.table} WHERE ${info.idCol} = $1`, [Number(row.party_id)]);
        const currentWallet = money(pbRes.rows[0]?.wb || 0);
        const walletDelta = row.credit ? -amount : amount; // credit=true originally ADDED to wallet
        const newWallet = Math.max(0, currentWallet + walletDelta);
        await client.query(`UPDATE ${info.table} SET ${info.balanceCol} = $1 WHERE ${info.idCol} = $2`, [newWallet, Number(row.party_id)]);

        // 2. Reverse party receivable/payable
        const p = partyBalanceDelta(row, -amount); // negative of original effect
        if (p && p.table === 'payable') {
            await client.query('UPDATE suppliers SET payable_balance = COALESCE(payable_balance, 0) + $1 WHERE id = $2', [p.signed, Number(row.party_id)]);
        } else if (p) {
            await client.query('UPDATE customers SET receivable_balance = COALESCE(receivable_balance, 0) + $1 WHERE id = $2', [p.signed, Number(row.party_id)]);
        }

        // 3. Reverse payment_accounts balance for account_effect
        if (row.account_id && row.account_effect === 'in') {
            await client.query('UPDATE payment_accounts SET balance = GREATEST(0, balance - $1) WHERE id = $2', [amount, row.account_id]);
            await logAccountTxn(client, row.account_id, 'withdraw', amount, row.reference,
                `Wallet transaction #${id} reversed (${row.type}) — money returned from ${row.account_name || 'account'}`);
        } else if (row.account_id && row.account_effect === 'out') {
            await client.query('UPDATE payment_accounts SET balance = COALESCE(balance, 0) + $1 WHERE id = $2', [amount, row.account_id]);
            await logAccountTxn(client, row.account_id, 'deposit', amount, row.reference,
                `Wallet transaction #${id} reversed (${row.type}) — money returned to ${row.account_name || 'account'}`);
        }
        // account_effect 'none' → drawer never moved, skip balance & ledger

        // 4. Soft-delete original (history retained), write reversal, move to trash
        await client.query('UPDATE wallet_transactions SET deleted_at = NOW() WHERE id = $1', [id]);
        await writeWalletLedger(client, {
            party_type: row.party_type, party_id: Number(row.party_id), party_name: row.party_name,
            type: 'wallet_delete_reverse', amount, credit: !row.credit,
            account_id: row.account_id, account_name: row.account_name,
            account_effect: row.account_effect === 'in' ? 'out' : (row.account_effect === 'out' ? 'in' : 'none'),
            cash_drawer_effect: row.cash_drawer_effect,
            reference: row.reference, note: `Reversal of wallet transaction #${id} (${row.type})`,
            balance_before: currentWallet, balance_after: newWallet,
        });
        await client.query(`
            INSERT INTO trash_records (table_name, record_id, record_title, record_data, deleted_at)
            VALUES ('wallet_transactions', $1, $2, $3, NOW())
        `, [id, `Wallet ${row.type} ৳${amount} (${row.party_name || row.party_type} #${row.party_id})`, JSON.stringify(row)]).catch(() => null);

        await client.query('COMMIT');
        return res.status(200).json({
            success: true,
            message: `Wallet transaction #${id} (${row.type}, ৳${amount}) reversed successfully. Full rollback & history logged.`,
            data: { wallet_balance: newWallet },
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('deleteWalletTransaction error:', error);
        return res.status(400).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};

// =========================================================
// PATCH /api/wallets/transaction/:id  → edit amount/note + delta rollback & reapply
// =========================================================
exports.editWalletTransaction = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { amount: rawNew, note, reference } = req.body;
        await client.query('BEGIN');
        await ensureWalletSchema();

        const tRes = await client.query('SELECT * FROM wallet_transactions WHERE id = $1 AND deleted_at IS NULL', [id]);
        if (!tRes.rows.length) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Wallet transaction not found or already reversed.' });
        }
        const row = tRes.rows[0];
        if (SYSTEM_WALLET_TYPES.has(row.type)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'This wallet transaction was created by a sale/purchase flow and cannot be edited directly.' });
        }

        const oldAmount = money(row.amount);
        const newAmount = rawNew !== undefined ? money(rawNew) : oldAmount;
        if (newAmount <= 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'Please enter a valid positive amount.' });
        }
        const delta = newAmount - oldAmount;

        const info = partyInfo(row.party_type);
        if (!info) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'Unknown party type on wallet transaction.' });
        }

        const pbRes = await client.query(`SELECT ${info.balanceCol} AS wb FROM ${info.table} WHERE ${info.idCol} = $1`, [Number(row.party_id)]);
        const currentWallet = money(pbRes.rows[0]?.wb || 0);
        let currentWalletNew = currentWallet;

        if (delta !== 0) {
            // 1. wallet_balance delta
            const walletDelta = row.credit ? delta : -delta;
            const newWallet = currentWallet + walletDelta;
            if (newWallet < -0.009) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: `Cannot edit: resulting wallet balance would be negative (৳${newWallet.toFixed(2)}).` });
            }
            await client.query(`UPDATE ${info.table} SET ${info.balanceCol} = $1 WHERE ${info.idCol} = $2`, [Math.max(0, newWallet), Number(row.party_id)]);

            // 2. receivable/payable delta
            const p = partyBalanceDelta(row, delta);
            if (p && p.table === 'payable') {
                await client.query('UPDATE suppliers SET payable_balance = COALESCE(payable_balance, 0) + $1 WHERE id = $2', [p.signed, Number(row.party_id)]);
            } else if (p) {
                await client.query('UPDATE customers SET receivable_balance = COALESCE(receivable_balance, 0) + $1 WHERE id = $2', [p.signed, Number(row.party_id)]);
            }

            // 3. account delta
            if (row.account_id) {
                if (row.account_effect === 'in') {
                    await client.query('UPDATE payment_accounts SET balance = COALESCE(balance, 0) + $1 WHERE id = $2', [delta, row.account_id]);
                    await logAccountTxn(client, row.account_id, 'adjustment', delta, row.reference,
                        `Wallet transaction #${id} edited: account delta ৳${delta}`);
                } else if (row.account_effect === 'out') {
                    await client.query('UPDATE payment_accounts SET balance = COALESCE(balance, 0) - $1 WHERE id = $2', [delta, row.account_id]);
                    await logAccountTxn(client, row.account_id, 'adjustment', -delta, row.reference,
                        `Wallet transaction #${id} edited: account delta ৳${-delta}`);
                }
            }

            // 4. Edit ledger history
            await writeWalletLedger(client, {
                party_type: row.party_type, party_id: Number(row.party_id), party_name: row.party_name,
                type: 'wallet_edit', amount: Math.abs(delta), credit: delta > 0 ? row.credit : !row.credit,
                account_id: row.account_id, account_name: row.account_name,
                account_effect: row.account_effect, cash_drawer_effect: row.cash_drawer_effect,
                reference: row.reference, note: `Wallet transaction #${id} edited: amount changed by ৳${Math.abs(delta)} (${delta > 0 ? 'increased' : 'decreased'})`,
                balance_before: currentWallet, balance_after: Math.max(0, currentWallet + (row.credit ? delta : -delta)),
            });
            currentWalletNew = Math.max(0, currentWallet + (row.credit ? delta : -delta));
        }

        // 5. Update the original row
        const upd = [];
        const params = [];
        let pi = 1;
        if (rawNew !== undefined) { upd.push(`amount = $${pi++}`); params.push(newAmount); }
        if (note !== undefined) { upd.push(`note = $${pi++}`); params.push(note); }
        if (reference !== undefined) { upd.push(`reference = $${pi++}`); params.push(reference); }
        if (upd.length) {
            params.push(Number(id));
            await client.query(`UPDATE wallet_transactions SET ${upd.join(', ')} WHERE id = $${pi}`, params);
        }

        await client.query('COMMIT');
        return res.status(200).json({
            success: true,
            message: `Wallet transaction #${id} updated (${oldAmount} → ${newAmount}).`,
            data: { wallet_balance: typeof currentWalletNew !== 'undefined' ? currentWalletNew : currentWallet },
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('editWalletTransaction error:', error);
        return res.status(400).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};

module.exports = { ensureWalletSchema, getPartyWallet: exports.getPartyWallet, postWalletTransaction: exports.postWalletTransaction, deleteWalletTransaction: exports.deleteWalletTransaction, editWalletTransaction: exports.editWalletTransaction, writeWalletLedger, drawerLedgerOnly, logAccountTxn, money, accountEffect };