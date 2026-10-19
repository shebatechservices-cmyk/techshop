const pool = require('../../../config/db');
const { ensureWalletSchema, writeWalletLedger } = require('../../walletController');
const { ensureWarrantyTables } = require('../warrantySchema');

// Process Return & Refund
exports.processReturn = async (req, res) => {
    const client = await pool.connect();
    try {
        await ensureWarrantyTables();
        const {
            order_source = 'offline',
            invoice_no,
            ecommerce_order_no,
            customer_id,
            customer_name,
            customer_phone,
            product_id,
            product_name,
            serial_code,
            return_qty = 1,
            return_type = 'Refund',
            refund_amount = 0,
            refund_method = 'Cash',
            condition = 'Good',
            return_reason = ''
        } = req.body;

        await client.query('BEGIN');

        const return_no = 'RET-' + new Date().getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 9000));

        // Insert into product_returns
        const returnQuery = `
            INSERT INTO product_returns 
            (return_no, order_source, invoice_no, ecommerce_order_no, customer_id, customer_name, customer_phone,
             product_id, product_name, serial_code, return_qty, return_type, refund_amount, refund_method, condition, return_reason) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) 
            RETURNING *;
        `;
        const returnValues = [
            return_no,
            order_source,
            invoice_no || null,
            ecommerce_order_no || null,
            customer_id || null,
            customer_name || 'Customer',
            customer_phone || '',
            product_id || null,
            product_name || 'Product Unit',
            serial_code || '',
            parseInt(return_qty, 10) || 1,
            return_type,
            parseFloat(refund_amount) || 0,
            refund_method,
            condition,
            return_reason
        ];
        const returnRes = await client.query(returnQuery, returnValues);

        // If condition is Good, restock into products inventory
        if (condition === 'Good' && product_id) {
            await client.query(
                `UPDATE products SET stock = COALESCE(stock, 0) + $1, updated_at = NOW() WHERE id = $2`,
                [parseInt(return_qty, 10) || 1, product_id]
            ).catch(() => null);
        }

        // If Damaged, quarantine into damaged_products
        if (condition === 'Damaged' && product_id) {
            await client.query(
                'INSERT INTO damaged_products (product_id, quantity, note) VALUES ($1, $2, $3)', 
                [product_id, parseInt(return_qty, 10) || 1, return_reason]
            ).catch(() => null);
        }

        // Process Refund / Due Adjustment / Store Credit
        if (parseFloat(refund_amount) > 0) {
            const refundAmt = parseFloat(refund_amount);
            const isStoreCredit = ['customer ledger', 'store credit', 'wallet', 'adjustment'].includes(String(refund_method || '').toLowerCase());

            if (isStoreCredit && customer_id) {
                await ensureWalletSchema();
                const custRes = await client.query(
                    'SELECT receivable_balance, wallet_balance FROM customers WHERE id = $1',
                    [customer_id]
                );
                const currentDue = Math.max(0, parseFloat(custRes.rows[0]?.receivable_balance || 0));
                const currentWallet = parseFloat(custRes.rows[0]?.wallet_balance || 0);

                let dueDeduction = 0;
                let walletCredit = 0;

                if (currentDue > 0) {
                    dueDeduction = Math.min(currentDue, refundAmt);
                    walletCredit = refundAmt - dueDeduction;
                } else {
                    walletCredit = refundAmt;
                }

                if (dueDeduction > 0) {
                    await client.query(
                        'UPDATE customers SET receivable_balance = GREATEST(0, COALESCE(receivable_balance, 0) - $1), updated_at = NOW() WHERE id = $2',
                        [dueDeduction, customer_id]
                    );
                }

                if (walletCredit > 0) {
                    await client.query(
                        'UPDATE customers SET wallet_balance = COALESCE(wallet_balance, 0) + $1, updated_at = NOW() WHERE id = $2',
                        [walletCredit, customer_id]
                    );
                    await writeWalletLedger(client, {
                        party_type: 'customer', party_id: Number(customer_id), party_name: customer_name || 'Customer',
                        type: 'return_store_credit', amount: walletCredit, credit: true,
                        account_effect: 'none', cash_drawer_effect: 'none',
                        reference: return_no, note: `Product return ${return_no} — store credit to wallet (due reduced ৳${dueDeduction.toFixed(2)})`,
                        balance_before: currentWallet, balance_after: currentWallet + walletCredit,
                    });
                }
            } else {
                // Direct Cash / Bank / MFS refund payout → deducts from designated account or drawer
                const drawerRes = await client.query(
                    "SELECT id, name FROM payment_accounts WHERE account_type = 'drawer' OR id = 1 ORDER BY (account_type = 'drawer') DESC LIMIT 1"
                ).catch(() => ({ rows: [] }));
                if (drawerRes.rows.length) {
                    const drawerId = drawerRes.rows[0].id;
                    await client.query(
                        'UPDATE payment_accounts SET balance = GREATEST(0, balance - $1) WHERE id = $2',
                        [refundAmt, drawerId]
                    );
                    const isNonCash = String(refund_method || '').toLowerCase() !== 'cash';
                    await client.query(`
                        INSERT INTO account_transactions (account_id, type, amount, reference, note, created_at)
                        VALUES ($1, 'refund', $2, $3, $4, NOW())
                    `, [drawerId, refundAmt, return_no,
                        `Product return ${return_no} refund payout (${refund_method || 'Cash'})${isNonCash ? ' — manual transaction ID entry' : ''}`]);
                }
            }
        }

        await client.query('COMMIT');

        return res.status(200).json({
            success: true,
            message: `Product return ${return_no} processed successfully! ${condition === 'Good' ? 'Restocked into active inventory.' : 'Sent to damage quarantine.'}`,
            data: returnRes.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Process return error:', error);
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};
