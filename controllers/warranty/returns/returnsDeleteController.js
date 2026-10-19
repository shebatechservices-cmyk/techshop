const pool = require('../../../config/db');
const { ensureWalletSchema, writeWalletLedger } = require('../../walletController');

// Delete Return (Soft Delete to Trash with Full Stock & Financial Reversal)
exports.deleteReturn = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const returnId = parseInt(id, 10);
        if (!returnId) return res.status(400).json({ success: false, message: 'Invalid return ID' });

        await client.query('BEGIN');

        const existing = await client.query('SELECT * FROM product_returns WHERE id = $1', [returnId]);
        if (!existing.rows.length) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Return not found' });
        }

        const ret = existing.rows[0];
        const returnQty = parseInt(ret.return_qty, 10) || 1;
        const refundAmt = parseFloat(ret.refund_amount || 0);

        // 1. Revert restocked inventory
        if (ret.condition === 'Good' && ret.product_id) {
            await client.query(
                `UPDATE products SET stock = GREATEST(0, COALESCE(stock, 0) - $1), updated_at = NOW() WHERE id = $2`,
                [returnQty, ret.product_id]
            );
        }

        // 2. Revert financial / refund effect
        if (refundAmt > 0) {
            const isStoreCredit = ['customer ledger', 'store credit', 'wallet', 'adjustment'].includes(String(ret.refund_method || '').toLowerCase());
            if (isStoreCredit && ret.customer_id) {
                await ensureWalletSchema();
                await client.query(
                    'UPDATE customers SET wallet_balance = GREATEST(0, COALESCE(wallet_balance, 0) - $1), updated_at = NOW() WHERE id = $2',
                    [refundAmt, ret.customer_id]
                );
                await writeWalletLedger(client, {
                    party_type: 'customer', party_id: Number(ret.customer_id), party_name: ret.customer_name || 'Customer',
                    type: 'return_delete_reversal', amount: refundAmt, credit: false,
                    account_effect: 'none', cash_drawer_effect: 'none',
                    reference: ret.return_no, note: `Product return ${ret.return_no} deleted — store credit reversed`,
                    balance_before: 0, balance_after: 0,
                });
            } else {
                // Cash / Bank refund was paid out → credit money back to cash drawer
                const drawerRes = await client.query(
                    "SELECT id, name FROM payment_accounts WHERE account_type = 'drawer' OR id = 1 ORDER BY (account_type = 'drawer') DESC LIMIT 1"
                ).catch(() => ({ rows: [] }));
                if (drawerRes.rows.length) {
                    const drawerId = drawerRes.rows[0].id;
                    await client.query(
                        'UPDATE payment_accounts SET balance = balance + $1 WHERE id = $2',
                        [refundAmt, drawerId]
                    );
                    await client.query(`
                        INSERT INTO account_transactions (account_id, type, amount, reference, note, created_at)
                        VALUES ($1, 'deposit', $2, $3, $4, NOW())
                    `, [drawerId, refundAmt, ret.return_no,
                        `Product return ${ret.return_no} deleted — refund cash returned to drawer`]);
                }
            }
        }

        // 3. Move to Global Trash
        await client.query('UPDATE product_returns SET deleted_at = NOW() WHERE id = $1', [returnId]);
        await client.query(
            `INSERT INTO trash_records (table_name, record_id, record_title, record_data, deleted_at)
             VALUES ('product_returns', $1, $2, $3, NOW())`,
            [returnId, `Product Return ${ret.return_no}`, JSON.stringify(ret)]
        ).catch(() => null);

        await client.query('COMMIT');
        return res.status(200).json({ success: true, message: `Product return ${ret.return_no} moved to Trash and balances restored.` });
    } catch (err) {
        await client.query('ROLLBACK').catch(() => null);
        console.error('Delete return error:', err);
        return res.status(500).json({ success: false, message: err.message });
    } finally {
        client.release();
    }
};
