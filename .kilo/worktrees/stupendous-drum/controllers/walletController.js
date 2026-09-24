const pool = require('../config/db');
const walletService = require('../services/walletService');

const {
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
} = walletService;

// System-generated wallet types that must not be deleted individually
const SYSTEM_WALLET_TYPES = new Set([
    'sale_payment', 'sale_edit_refund', 'sale_delete_refund',
    'purchase_payment', 'purchase_delete_refund', 'wallet_settlement',
]);

const partyBalanceDelta = (row, delta) => {
    if (!row || row.party_type === 'staff') return null;
    const table = row.party_type === 'supplier' ? 'payable' : 'receivable';
    const dir = row.type === 'due_payment' ? -1 : 0;
    if (dir === 0) return null;
    return { table, signed: dir * delta };
};

// =========================================================
// GET /api/wallets  → List centralized wallets
// =========================================================
exports.getWallets = async (req, res) => {
    try {
        await ensureWalletSchema();
        const { entity_type = 'all', search = '', page = 1, limit = 50 } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.max(1, parseInt(limit, 10) || 50);
        const offset = (pageNum - 1) * limitNum;

        const params = [];
        let whereClause = 'WHERE w.deleted_at IS NULL';
        let paramIdx = 1;

        const normType = normalizeEntityType(entity_type);
        if (normType) {
            whereClause += ` AND w.entity_type = $${paramIdx++}`;
            params.push(normType);
        }

        if (search && search.trim()) {
            whereClause += ` AND (w.entity_name ILIKE $${paramIdx} OR CAST(w.entity_id AS TEXT) ILIKE $${paramIdx})`;
            params.push(`%${search.trim()}%`);
            paramIdx++;
        }

        const countRes = await pool.query(`SELECT COUNT(*) FROM wallets w ${whereClause}`, params);
        const total = parseInt(countRes.rows[0]?.count || 0, 10);

        const listSql = `
            SELECT w.*,
                   (SELECT COUNT(*) FROM wallet_transactions wt WHERE wt.wallet_id = w.id AND wt.deleted_at IS NULL)::INT AS transaction_count,
                   (SELECT MAX(created_at) FROM wallet_transactions wt WHERE wt.wallet_id = w.id AND wt.deleted_at IS NULL) AS last_transaction_at
            FROM wallets w
            ${whereClause}
            ORDER BY w.updated_at DESC, w.id DESC
            LIMIT $${paramIdx++} OFFSET $${paramIdx++}
        `;
        const listRes = await pool.query(listSql, [...params, limitNum, offset]);

        // Aggregate statistics
        const statsRes = await pool.query(`
            SELECT
                COUNT(*)::INT AS total_wallets,
                COALESCE(SUM(balance), 0)::NUMERIC AS total_wallet_balance,
                COALESCE(SUM(CASE WHEN entity_type = 'customer' THEN balance ELSE 0 END), 0)::NUMERIC AS customer_balance,
                COALESCE(SUM(CASE WHEN entity_type = 'supplier' THEN balance ELSE 0 END), 0)::NUMERIC AS supplier_balance,
                COALESCE(SUM(CASE WHEN entity_type = 'staff' THEN balance ELSE 0 END), 0)::NUMERIC AS staff_balance
            FROM wallets
            WHERE deleted_at IS NULL
        `);

        return res.status(200).json({
            success: true,
            data: listRes.rows,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.max(1, Math.ceil(total / limitNum)),
            },
            stats: statsRes.rows[0],
        });
    } catch (error) {
        console.error('getWallets error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// =========================================================
// GET /api/wallets/:type/:id  → Get party wallet + ledger
// =========================================================
exports.getPartyWallet = async (req, res) => {
    const client = await pool.connect();
    try {
        const { type, id } = req.params;
        const partyId = Number(id);
        const normType = normalizeEntityType(type);
        const info = partyInfo(normType);
        if (!info || !partyId) {
            return res.status(400).json({ success: false, message: 'Invalid party type or ID.' });
        }

        await ensureWalletSchema(client);
        const wallet = await getOrCreateWallet(client, normType, partyId);

        const partyRes = await client.query(
            `SELECT ${info.idCol} AS id, ${info.nameCol} AS name, ${info.balanceCol} AS wallet_balance FROM ${info.table} WHERE ${info.idCol} = $1`,
            [partyId]
        );
        const party = partyRes.rows[0] || { id: partyId, name: wallet.entity_name, wallet_balance: wallet.balance };

        const ledgerRes = await client.query(
            `SELECT * FROM wallet_transactions
             WHERE ((wallet_id = $1) OR (party_type = $2 AND party_id = $3))
               AND deleted_at IS NULL
             ORDER BY id DESC LIMIT 200`,
            [wallet.id, normType, partyId]
        );

        return res.status(200).json({
            success: true,
            wallet,
            party,
            transactions: ledgerRes.rows,
        });
    } catch (error) {
        console.error('getPartyWallet error:', error);
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};

// =========================================================
// POST /api/wallets/transaction  → Universal Transaction Handler
// =========================================================
exports.postWalletTransaction = async (req, res) => {
    const client = await pool.connect();
    try {
        const {
            party_type, entity_type = party_type,
            party_id, entity_id = party_id,
            action, amount: rawAmount,
            account_id, note, reference, reference_type,
            transaction_id,
            allow_overdraft = false,
        } = req.body;

        const amount = money(rawAmount);
        if (!entity_type || !entity_id || !action || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Entity type, entity ID, action, and a positive amount are required.',
            });
        }

        await client.query('BEGIN');
        const result = await executeWalletTransaction(client, {
            entityType: entity_type,
            entityId: Number(entity_id),
            action,
            amount,
            accountId: account_id ? Number(account_id) : null,
            referenceType: reference_type || null,
            referenceId: reference || null,
            reference: reference || null,
            transactionId: transaction_id || null,
            note: note || null,
            allowOverdraft: allow_overdraft,
        });

        await client.query('COMMIT');
        return res.status(200).json({
            success: true,
            message: 'Wallet transaction completed successfully.',
            data: result,
        });
    } catch (error) {
        await client.query('ROLLBACK').catch(() => null);
        console.error('postWalletTransaction error:', error);
        return res.status(400).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};

// Shorthand top-up route
exports.postTopup = async (req, res) => {
    req.body.action = 'topup';
    return exports.postWalletTransaction(req, res);
};

// Shorthand withdraw / payout route
exports.postWithdraw = async (req, res) => {
    req.body.action = 'withdraw';
    return exports.postWalletTransaction(req, res);
};

// Shorthand settle route
exports.postSettle = async (req, res) => {
    req.body.action = req.body.action || 'due_settle';
    return exports.postWalletTransaction(req, res);
};

// =========================================================
// DELETE /api/wallets/transaction/:id  → Full Reversal & Audit Rollback
// =========================================================
exports.deleteWalletTransaction = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        await client.query('BEGIN');
        await ensureWalletSchema(client);

        const tRes = await client.query('SELECT * FROM wallet_transactions WHERE id = $1 AND deleted_at IS NULL', [id]);
        if (!tRes.rows.length) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Wallet transaction not found or already reversed.' });
        }
        const row = tRes.rows[0];
        if (SYSTEM_WALLET_TYPES.has(row.type)) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'This wallet transaction was created by an invoice/order flow and cannot be deleted individually. Delete the source invoice/purchase instead.',
            });
        }

        const amount = money(row.amount);
        if (amount <= 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'Invalid wallet transaction amount.' });
        }

        const normType = normalizeEntityType(row.entity_type || row.party_type);
        const info = partyInfo(normType);
        if (!info) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'Unknown entity type on wallet transaction.' });
        }

        const entityId = Number(row.entity_id || row.party_id);
        const wallet = await getOrCreateWallet(client, normType, entityId);
        const currentWallet = money(wallet.balance);

        // 1. Reverse wallet_balance (credit=true originally ADDED to wallet -> reverse subtracts)
        const walletDelta = row.credit ? -amount : amount;
        const newWallet = Math.max(0, currentWallet + walletDelta);

        await client.query('UPDATE wallets SET balance = $1, updated_at = NOW() WHERE id = $2', [newWallet, wallet.id]);
        await client.query(`UPDATE ${info.table} SET ${info.balanceCol} = $1 WHERE ${info.idCol} = $2`, [newWallet, entityId]);

        // 2. Reverse party receivable/payable if applicable
        const p = partyBalanceDelta(row, -amount);
        if (p && p.table === 'payable') {
            await client.query('UPDATE suppliers SET payable_balance = GREATEST(0, COALESCE(payable_balance, 0) + $1) WHERE id = $2', [p.signed, entityId]);
        } else if (p) {
            await client.query('UPDATE customers SET receivable_balance = GREATEST(0, COALESCE(receivable_balance, 0) + $1) WHERE id = $2', [p.signed, entityId]);
        }

        // 3. Reverse payment_accounts balance for physical account_effect using immutable reversing ledger entry
        if (row.account_id && row.account_effect === 'in') {
            await logAccountTxn(client, row.account_id, 'withdraw', amount, row.reference,
                `Wallet transaction #${id} reversed (${row.type}) — money returned from ${row.account_name || 'account'}`, {
                    sourceType: 'cancellation_adjustment',
                    sourceId: String(id),
                    transactionType: 'debit',
                });
        } else if (row.account_id && row.account_effect === 'out') {
            await logAccountTxn(client, row.account_id, 'deposit', amount, row.reference,
                `Wallet transaction #${id} reversed (${row.type}) — money returned to ${row.account_name || 'account'}`, {
                    sourceType: 'cancellation_adjustment',
                    sourceId: String(id),
                    transactionType: 'credit',
                });
        }

        // 4. Write immutable reversal audit ledger entry
        await writeWalletLedger(client, {
            wallet_id: wallet.id,
            entity_type: normType, entity_id: entityId, entity_name: wallet.entity_name,
            party_type: normType, party_id: entityId, party_name: wallet.entity_name,
            type: row.credit ? 'debit_reverse' : 'credit_reverse', amount, credit: !row.credit,
            account_id: row.account_id, account_name: row.account_name,
            account_effect: row.account_effect === 'in' ? 'out' : (row.account_effect === 'out' ? 'in' : 'none'),
            cash_drawer_effect: row.cash_drawer_effect === 'in' ? 'out' : (row.cash_drawer_effect === 'out' ? 'in' : 'none'),
            reference: row.reference ? `REV-${row.reference}` : `REV-WTX-${id}`, reference_type: 'cancellation_adjustment',
            note: `Reversal of wallet transaction #${id} (${row.type})`,
            balance_before: currentWallet, balance_after: newWallet,
        });

        await client.query('COMMIT');
        return res.status(200).json({
            success: true,
            message: `Wallet transaction #${id} (${row.type}, ৳${amount}) reversed successfully with offsetting ledger entry.`,
            data: { wallet_balance: newWallet },
        });
    } catch (error) {
        await client.query('ROLLBACK').catch(() => null);
        console.error('deleteWalletTransaction error:', error);
        return res.status(400).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};

// =========================================================
// PATCH /api/wallets/transaction/:id  → Strictly Prohibited for Immutable Audit Trail
// =========================================================
exports.editWalletTransaction = async (req, res) => {
    return res.status(403).json({
        success: false,
        message: 'Direct modification of wallet transactions is strictly prohibited to preserve accounting audit trail integrity. Post an offsetting reversal or adjustment entry instead.'
    });
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
    getWallets: exports.getWallets,
    getPartyWallet: exports.getPartyWallet,
    postWalletTransaction: exports.postWalletTransaction,
    postTopup: exports.postTopup,
    postWithdraw: exports.postWithdraw,
    postSettle: exports.postSettle,
    deleteWalletTransaction: exports.deleteWalletTransaction,
    editWalletTransaction: exports.editWalletTransaction,
};
