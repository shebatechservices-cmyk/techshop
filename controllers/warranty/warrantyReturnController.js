const pool = require('../../config/db');
const { ensureWalletSchema, writeWalletLedger } = require('../walletController');
const { ensureWarrantyTables } = require('./warrantySchema');

// Get All Product Returns
exports.getReturns = async (req, res) => {
    try {
        await ensureWarrantyTables();
        const { search } = req.query;
        let conditions = ['deleted_at IS NULL'];
        let params = [];

        if (search && search.trim()) {
            params.push(`%${search.trim().toLowerCase()}%`);
            conditions.push(`(
                LOWER(return_no) LIKE $${params.length} OR 
                LOWER(invoice_no) LIKE $${params.length} OR 
                LOWER(customer_name) LIKE $${params.length} OR 
                LOWER(product_name) LIKE $${params.length} OR 
                LOWER(serial_code) LIKE $${params.length}
            )`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const result = await pool.query(`SELECT * FROM product_returns ${whereClause} ORDER BY id DESC LIMIT 200;`, params);

        return res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error('Get returns error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

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
            return_type = 'Refund', // 'Refund' | 'Exchange' | 'Store Credit'
            refund_amount = 0,
            refund_method = 'Cash',
            condition = 'Good',     // 'Good' (Restock) | 'Damaged' (Damage bin)
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

// Update Return (Edit Return Record)
exports.updateReturn = async (req, res) => {
    try {
        await ensureWarrantyTables();
        const { id } = req.params;
        const {
            customer_name,
            customer_phone,
            product_name,
            serial_code,
            return_type,
            condition,
            refund_amount,
            return_reason,
            invoice_no
        } = req.body;

        const updateFields = [];
        const values = [];

        if (customer_name !== undefined) {
            values.push(customer_name ? customer_name.trim() : null);
            updateFields.push(`customer_name = $${values.length}`);
        }
        if (customer_phone !== undefined) {
            values.push(customer_phone ? customer_phone.trim() : null);
            updateFields.push(`customer_phone = $${values.length}`);
        }
        if (product_name !== undefined) {
            values.push(product_name ? product_name.trim() : null);
            updateFields.push(`product_name = $${values.length}`);
        }
        if (serial_code !== undefined) {
            values.push(serial_code ? serial_code.trim() : null);
            updateFields.push(`serial_code = $${values.length}`);
        }
        if (return_type !== undefined) {
            values.push(return_type);
            updateFields.push(`return_type = $${values.length}`);
        }
        if (condition !== undefined) {
            values.push(condition);
            updateFields.push(`condition = $${values.length}`);
        }
        if (refund_amount !== undefined) {
            values.push(parseFloat(refund_amount || 0));
            updateFields.push(`refund_amount = $${values.length}`);
        }
        if (return_reason !== undefined) {
            values.push(return_reason ? return_reason.trim() : null);
            updateFields.push(`return_reason = $${values.length}`);
        }
        if (invoice_no !== undefined) {
            values.push(invoice_no ? invoice_no.trim() : null);
            updateFields.push(`invoice_no = $${values.length}`);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields provided to update.' });
        }

        values.push(id);
        const query = `
            UPDATE product_returns 
            SET ${updateFields.join(', ')} 
            WHERE id = $${values.length} 
            RETURNING *;
        `;
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Return record not found.' });
        }

        return res.status(200).json({
            success: true,
            message: `Product return ${result.rows[0].return_no} updated successfully!`,
            data: result.rows[0]
        });
    } catch (err) {
        console.error('updateReturn error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};
