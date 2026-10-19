const pool = require('../../config/db');
const walletService = require('../../services/walletService');

const {
    ensureWalletSchema,
    normalizeEntityType,
    partyInfo,
    logAccountTxn,
    getOrCreateWallet,
    writeWalletLedger,
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

// DELETE /api/wallets/transaction/:id  → Full Reversal & Audit Rollback
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

// PATCH /api/wallets/transaction/:id  → Strictly Prohibited for Immutable Audit Trail
exports.editWalletTransaction = async (req, res) => {
    return res.status(403).json({
        success: false,
        message: 'Direct modification of wallet transactions is strictly prohibited to preserve accounting audit trail integrity. Post an offsetting reversal or adjustment entry instead.'
    });
};
