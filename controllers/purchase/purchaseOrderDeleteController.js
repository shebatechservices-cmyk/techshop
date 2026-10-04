const pool = require("../../config/db");
const {
    money,
    ensurePurchaseColumns,
    reversePurchasePayment,
    applyPurchasePayment,
} = require("./purchaseHelpers");

const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const poRes = await pool.query('SELECT * FROM purchase_orders WHERE id = $1', [id]);
        if (!poRes.rows.length) {
            return res.status(404).json({ error: 'Purchase order not found' });
        }
        const po = poRes.rows[0];

        const createdAt = new Date(po.created_at || Date.now());
        const hoursOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
        if (hoursOld > 168) {
            return res.status(400).json({
                error: "Delete window (7 days) has expired. Please use the Return/Exchange module instead."
            });
        }

        if (po.supplier_id) {
            const laterPO = await pool.query(
                'SELECT po_number FROM purchase_orders WHERE supplier_id = $1 AND id != $2 AND created_at > (SELECT created_at FROM purchase_orders WHERE id = $2) AND deleted_at IS NULL LIMIT 1',
                [po.supplier_id, id]
            ).catch(() => ({ rows: [] }));
            if (laterPO.rows.length > 0) {
                return res.status(400).json({
                    error: `Cannot delete purchase order: Later purchase order (#${laterPO.rows[0].po_number}) has already been recorded for this supplier. Only the most recent transaction can be deleted.`
                });
            }
        }

        const serialSoldCheck = await pool.query(`
            SELECT DISTINCT s.invoice_no 
            FROM sales_item_serials sis
            JOIN sales_items si ON si.id = sis.sales_item_id
            JOIN sales s ON s.id = si.sale_id
            JOIN purchase_order_serials pos ON LOWER(TRIM(pos.serial_code)) = LOWER(TRIM(sis.serial_code))
            JOIN purchase_order_items poi ON poi.id = pos.purchase_order_item_id
            WHERE poi.purchase_order_id = $1
              AND s.deleted_at IS NULL
        `, [id]).catch(() => ({ rows: [] }));

        const salesCheck = await pool.query(`
            SELECT DISTINCT s.invoice_no 
            FROM sales_items si
            JOIN sales s ON s.id = si.sale_id
            JOIN purchase_order_items poi ON poi.product_id = si.product_id
            JOIN products p ON p.id = poi.product_id
            WHERE poi.purchase_order_id = $1 
              AND p.is_serial_tracked = false
              AND s.created_at > (SELECT created_at FROM purchase_orders WHERE id = $1)
              AND s.deleted_at IS NULL
              AND p.stock < poi.quantity
        `, [id]).catch(() => ({ rows: [] }));

        const allLinkedInvoices = [...new Set([
            ...serialSoldCheck.rows.map(r => r.invoice_no).filter(Boolean),
            ...salesCheck.rows.map(r => r.invoice_no).filter(Boolean)
        ])];

        if (allLinkedInvoices.length > 0) {
            const invoiceList = allLinkedInvoices.map(inv => `[Invoice #${inv}]`).join(', ');
            return res.status(400).json({
                error: `Cannot delete Purchase! Items from this batch are already sold. Please delete or rollback Sale Invoices ${invoiceList} first.`,
                linked_invoices: allLinkedInvoices
            });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const poItems = await client.query(
                'SELECT product_id, quantity FROM purchase_order_items WHERE purchase_order_id = $1',
                [id]
            );
            for (const item of poItems.rows) {
                const pid = item.product_id;
                const pInfo = await client.query('SELECT conversion_rate, unit_name, sub_unit_name FROM products WHERE id = $1', [pid]);
                const convRate = Number(pInfo.rows[0]?.conversion_rate || 1);
                const isSubUnit = item.unit_type === 'sub_unit' || (pInfo.rows[0]?.sub_unit_name && item.unit === pInfo.rows[0]?.sub_unit_name);
                const decrementQty = isSubUnit ? Number(item.quantity || 0) : Number(item.quantity || 0) * (convRate > 1 ? convRate : 1);

                await client.query(
                    `UPDATE products
                     SET stock = GREATEST(0, COALESCE(stock, 0) - $1),
                         purchase_count = GREATEST(0, COALESCE(purchase_count, 0) - 1),
                         updated_at = NOW()
                     WHERE id = $2`,
                    [decrementQty, pid]
                );

                await client.query(
                    `UPDATE stock_levels
                     SET quantity = GREATEST(0, COALESCE(quantity, 0) - $1)
                     WHERE product_id = $2 AND warehouse_id = 1`,
                    [decrementQty, pid]
                ).catch(() => null);

                await client.query(
                    `UPDATE products p
                     SET purchase_price = COALESCE((
                          SELECT poi.cost_price 
                          FROM purchase_order_items poi 
                          JOIN purchase_orders po ON po.id = poi.purchase_order_id 
                          WHERE poi.product_id = p.id AND po.id != $1 AND po.deleted_at IS NULL 
                          ORDER BY po.created_at DESC 
                          LIMIT 1
                     ), 0),
                     selling_price = COALESCE((
                          SELECT COALESCE(NULLIF(poi.final_sale_price, 0), poi.sale_price)
                          FROM purchase_order_items poi 
                          JOIN purchase_orders po ON po.id = poi.purchase_order_id 
                          WHERE poi.product_id = p.id AND po.id != $1 AND po.deleted_at IS NULL 
                          ORDER BY po.created_at DESC 
                          LIMIT 1
                     ), p.selling_price)
                     WHERE p.id = $2`,
                    [id, pid]
                ).catch(() => null);
            }

            await client.query(
                `DELETE FROM purchase_order_serials 
                 WHERE purchase_order_item_id IN (
                     SELECT id FROM purchase_order_items WHERE purchase_order_id = $1
                 )`,
                [id]
            );

            await client.query('DELETE FROM purchase_order_items WHERE purchase_order_id = $1', [id]);

            if (po.supplier_id && Number(po.total_due) > 0) {
                await client.query(
                    `UPDATE suppliers 
                     SET payable_balance = GREATEST(0, COALESCE(payable_balance, 0) - $1), 
                         updated_at = NOW() 
                     WHERE id = $2`,
                    [Number(po.total_due), po.supplier_id]
                );
            }

            const poPayments = await client.query(
                'SELECT * FROM purchase_order_payments WHERE purchase_order_id = $1',
                [id]
            );
            for (const pay of poPayments.rows) {
                await reversePurchasePayment(client, {
                    payment: pay,
                    poNumber: po.po_number || id,
                    supplierId: po.supplier_id,
                    ledgerType: 'purchase_delete_refund',
                    reasonNote: `PO ${po.po_number || id} deleted`,
                });
            }
            await client.query('DELETE FROM purchase_order_payments WHERE purchase_order_id = $1', [id]);
            await client.query('DELETE FROM payments WHERE purchase_id = $1', [id]).catch(() => null);

            await client.query("UPDATE purchase_orders SET deleted_at = NOW(), status = 'cancelled', updated_at = NOW() WHERE id = $1", [id]);
            await client.query(`
                INSERT INTO trash_records (table_name, record_id, record_title, record_data, deleted_at)
                VALUES ('purchase_orders', $1, $2, $3, NOW())
            `, [id, `PO #${po.po_number || id}`, JSON.stringify(po)]).catch(() => null);

            await client.query('COMMIT');
        } catch (txErr) {
            await client.query('ROLLBACK').catch(() => null);
            throw txErr;
        } finally {
            client.release();
        }

        res.status(200).json({ success: true, message: `Purchase order #${po.po_number || id} moved to Trash successfully! Stock and inventory reversed.` });
    } catch (error) {
        console.error('Delete purchase order error:', error);
        res.status(500).json({ error: error.message || 'Failed to delete purchase order' });
    }
};

module.exports = { deleteOrder };
