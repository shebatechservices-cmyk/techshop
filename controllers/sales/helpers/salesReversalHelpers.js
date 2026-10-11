const { money } = require('./salesFormatHelpers');
const { reverseSaleTender } = require('./salesTenderHelpers');
const { ensureWalletSchema } = require('../../walletController');

// Full financial reversal for a deleted sale
const reverseSaleFinancials = async (sale, id, client) => {
    let oldTenders = [];
    try {
        oldTenders = Array.isArray(sale.payment_details)
            ? sale.payment_details
            : (typeof sale.payment_details === 'string' ? JSON.parse(sale.payment_details) : []);
    } catch (e) { oldTenders = []; }

    const saleItems = await client.query('SELECT * FROM sales_items WHERE sale_id = $1', [id]);
    for (const item of saleItems.rows) {
        const prodRes = await client.query('SELECT is_bundle, conversion_rate, unit_name, sub_unit_name FROM products WHERE id = $1', [item.product_id]);
        const isBundle = Boolean(prodRes.rows[0]?.is_bundle);

        if (isBundle) {
            const bundleItemsRes = await client.query('SELECT product_id, quantity FROM product_bundle_items WHERE bundle_id = $1', [item.product_id]);
            for (const bItem of bundleItemsRes.rows) {
                const restoreQty = Number(item.quantity || 1) * Number(bItem.quantity || 1);
                await client.query(
                    'UPDATE products SET stock = COALESCE(stock, 0) + $1, updated_at = NOW() WHERE id = $2',
                    [restoreQty, bItem.product_id]
                );
                await client.query(
                    'UPDATE stock_levels SET quantity = quantity + $1 WHERE product_id = $2 AND warehouse_id = 1',
                    [restoreQty, bItem.product_id]
                ).catch(() => null);
            }
        } else {
            const prodData = prodRes.rows[0];
            const convRate = Number(prodData?.conversion_rate || 1);
            const isSubUnit = item.unit_type === 'sub_unit' || (prodData?.sub_unit_name && item.unit_name === prodData?.sub_unit_name);
            const restoreMultiplier = isSubUnit ? 1 : (convRate > 1 ? convRate : 1);
            const restoreQty = Number(item.quantity || 0) * restoreMultiplier;

            await client.query(
                'UPDATE products SET stock = COALESCE(stock, 0) + $1, updated_at = NOW() WHERE id = $2',
                [restoreQty, item.product_id]
            );
            await client.query(
                'UPDATE stock_levels SET quantity = quantity + $1 WHERE product_id = $2 AND warehouse_id = 1',
                [restoreQty, item.product_id]
            ).catch(() => null);
        }
    }
    await client.query('DELETE FROM sales_item_serials WHERE sales_item_id IN (SELECT id FROM sales_items WHERE sale_id = $1)', [id]);
    await client.query('DELETE FROM sales_items WHERE sale_id = $1', [id]);

    const customerId = Number(sale.customer_id);
    if (customerId) {
        const dueRev = money(sale.due_amount);
        if (dueRev !== 0) {
            await client.query(
                'UPDATE customers SET receivable_balance = GREATEST(0, COALESCE(receivable_balance, 0) - $1) WHERE id = $2',
                [dueRev, customerId]
            );
        }
        await ensureWalletSchema(client);
        if (money(sale.loyalty_points_used) > 0) {
            await client.query(
                'UPDATE customers SET loyalty_points = COALESCE(loyalty_points, 0) + $1 WHERE id = $2',
                [money(sale.loyalty_points_used), customerId]
            );
        }
        if (money(sale.loyalty_points_earned) > 0) {
            await client.query(
                'UPDATE customers SET loyalty_points = GREATEST(0, COALESCE(loyalty_points, 0) - $1) WHERE id = $2',
                [money(sale.loyalty_points_earned), customerId]
            );
        }
    }

    if (oldTenders.length > 0) {
        for (const t of oldTenders) {
            await reverseSaleTender(client, {
                customerId,
                invoiceNo: sale.invoice_no,
                tender: t,
                ledgerType: 'sale_delete_refund',
                reasonNote: 'deleted',
            });
        }
    } else if (money(sale.paid_amount) > 0) {
        await reverseSaleTender(client, {
            customerId,
            invoiceNo: sale.invoice_no,
            tender: { amount: sale.paid_amount, payment_mode: 'Cash' },
            ledgerType: 'sale_delete_refund',
            reasonNote: 'deleted',
        });
    }
};

module.exports = {
    reverseSaleFinancials,
};
