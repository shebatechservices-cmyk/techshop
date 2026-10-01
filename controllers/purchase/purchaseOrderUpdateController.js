const pool = require("../../config/db");
const {
    money,
    ensurePurchaseColumns,
    reversePurchasePayment,
    applyPurchasePayment,
} = require("./purchaseHelpers");

const updateOrder = async (req, res) => {
    await ensurePurchaseColumns();
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const poRes = await client.query('SELECT * FROM purchase_orders WHERE id = $1', [id]);
        if (!poRes.rows.length) {
            return res.status(404).json({ error: 'Purchase order not found' });
        }
        const po = poRes.rows[0];

        const createdAt = new Date(po.created_at || Date.now());
        const hoursOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
        if (hoursOld > 360) {
            return res.status(400).json({
                error: `Cannot edit purchase order: PO #${po.po_number || id} was created ${Math.floor(hoursOld / 24)} days ago. Edits are only permitted within 15 days (360 hours) of creation.`
            });
        }

        const salesCheck = await client.query(`
            SELECT poi.product_id, p.name as product_name, COUNT(si.id) as sold_count
            FROM purchase_order_items poi
            JOIN products p ON p.id = poi.product_id
            JOIN sales_items si ON si.product_id = poi.product_id
            JOIN sales s ON s.id = si.sale_id
            WHERE poi.purchase_order_id = $1 
              AND s.created_at > (SELECT created_at FROM purchase_orders WHERE id = $1)
              AND s.deleted_at IS NULL
            GROUP BY poi.product_id, p.name
        `, [id]).catch(() => ({ rows: [] }));

        const soldProductMap = new Map();
        salesCheck.rows.forEach(r => soldProductMap.set(Number(r.product_id), Number(r.sold_count || 1)));
        const hasSales = soldProductMap.size > 0;

        await client.query('BEGIN');

        const {
            transaction_reference,
            extra_cost,
            extra_cost_category,
            extra_cost_notes,
            items = []
        } = req.body;

        let totalCost = money(extra_cost !== undefined ? extra_cost : po.extra_cost);
        let totalSale = 0;
        let unitCount = 0;

        if (Array.isArray(items) && items.length > 0) {
            const seenPids = new Set();
            const allPayloadSerials = [];

            for (const item of items) {
                const pid = parseInt(item.product_id, 10);
                if (seenPids.has(pid)) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ error: 'The same item cannot be added twice in a purchase order.' });
                }
                seenPids.add(pid);

                if (Array.isArray(item.serials)) {
                    for (const s of item.serials) {
                        const trimmed = String(s || '').trim();
                        if (trimmed) {
                            const lower = trimmed.toLowerCase();
                            if (allPayloadSerials.includes(lower)) {
                                await client.query('ROLLBACK');
                                return res.status(400).json({
                                    error: `Duplicate serial/barcode "${trimmed}" found within this purchase order submission`
                                });
                            }
                            allPayloadSerials.push(lower);
                        }
                    }
                }
            }

            if (allPayloadSerials.length > 0) {
                const existingSerialsRes = await client.query(
                    `SELECT pos.serial_code, po.po_number, p.name AS product_name
                     FROM purchase_order_serials pos
                     JOIN purchase_order_items poi ON poi.id = pos.purchase_order_item_id
                     JOIN purchase_orders po ON po.id = poi.purchase_order_id
                     JOIN products p ON p.id = poi.product_id
                     WHERE LOWER(TRIM(pos.serial_code)) = ANY($1)
                       AND po.id != $2
                       AND po.deleted_at IS NULL
                     LIMIT 5`,
                    [allPayloadSerials, id]
                );
                if (existingSerialsRes.rows.length > 0) {
                    const duplicates = existingSerialsRes.rows.map(r => `"${r.serial_code}" (in PO ${r.po_number || 'N/A'}, Product: ${r.product_name || 'N/A'})`).join(', ');
                    await client.query('ROLLBACK');
                    return res.status(400).json({
                        error: `The following serial(s)/barcode(s) already exist in Inventory: ${duplicates}`
                    });
                }
            }

            const existingPoiRes = await client.query('SELECT * FROM purchase_order_items WHERE purchase_order_id = $1', [id]);
            const existingPoiMap = new Map(existingPoiRes.rows.map(r => [Number(r.id), r]));
            const newItemIds = new Set(items.map(it => it.id ? Number(it.id) : null).filter(Boolean));

            for (const [oldPoiId, oldPoi] of existingPoiMap.entries()) {
                if (!newItemIds.has(oldPoiId)) {
                    const oldPid = Number(oldPoi.product_id);
                    if (soldProductMap.has(oldPid)) {
                        await client.query('ROLLBACK');
                        return res.status(400).json({
                            error: `Cannot remove product ID ${oldPid} from purchase order because units from this PO have already been sold.`
                        });
                    }
                    await client.query(
                        `UPDATE products 
                         SET stock = GREATEST(0, COALESCE(stock, 0) - $1), 
                             purchase_count = GREATEST(0, COALESCE(purchase_count, 0) - 1),
                             updated_at = NOW() 
                         WHERE id = $2`,
                        [Number(oldPoi.quantity || 0), oldPid]
                    );
                    await client.query(
                        `UPDATE stock_levels 
                         SET quantity = GREATEST(0, COALESCE(quantity, 0) - $1) 
                         WHERE product_id = $2 AND warehouse_id = 1`,
                        [Number(oldPoi.quantity || 0), oldPid]
                    ).catch(() => null);

                    await client.query('DELETE FROM purchase_order_serials WHERE purchase_order_item_id = $1', [oldPoiId]);
                    await client.query('DELETE FROM purchase_order_items WHERE id = $1', [oldPoiId]);
                }
            }

            for (const item of items) {
                const pid = parseInt(item.product_id, 10);
                const costPrice = money(item.cost_price);
                const salePrice = money(item.sale_price);
                const finalSale = money(item.final_sale_price || item.sale_price);
                const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);

                if (soldProductMap.has(pid)) {
                    const minAllowed = soldProductMap.get(pid);
                    if (quantity < minAllowed) {
                        await client.query('ROLLBACK');
                        return res.status(400).json({
                            error: `Quantity for product ID ${pid} cannot be less than ${minAllowed} because ${minAllowed} unit(s) have already been sold.`
                        });
                    }
                }

                totalCost += costPrice * quantity;
                totalSale += finalSale * quantity;
                unitCount += quantity;

                let poiId = item.id ? parseInt(item.id, 10) : null;
                const oldPoi = poiId ? existingPoiMap.get(poiId) : null;
                const oldQty = oldPoi ? Number(oldPoi.quantity || 0) : 0;
                const qtyDiff = quantity - oldQty;

                const marginType = item.margin_type || 'percent';
                let marginVal = money(item.margin_value);
                if (marginVal === 0 && costPrice > 0 && finalSale > costPrice) {
                    if (marginType === 'amount') {
                        marginVal = money(finalSale - costPrice);
                    } else {
                        marginVal = money(((finalSale - costPrice) / costPrice) * 100);
                    }
                }

                if (oldPoi) {
                    await client.query(
                        `UPDATE purchase_order_items 
                         SET cost_price = $1, sale_price = $2, final_sale_price = $3, quantity = $4, line_total = $5,
                             warranty_months = $6, expected_date = $7, supplier_warranty_months = $8, customer_warranty_months = $9,
                             margin_type = $10, margin_value = $11, updated_at = NOW()
                         WHERE id = $12`,
                        [
                            costPrice,
                            salePrice,
                            finalSale,
                            quantity,
                            costPrice * quantity,
                            item.warranty_months || 0,
                            item.expected_date,
                            item.supplier_warranty_months || 0,
                            item.customer_warranty_months || 0,
                            marginType,
                            marginVal,
                            poiId
                        ]
                    );
                } else {
                    const newPoi = await client.query(
                        `INSERT INTO purchase_order_items 
                         (purchase_order_id, product_id, cost_price, sale_price, final_sale_price, quantity, line_total, warranty_months, expected_date, supplier_warranty_months, customer_warranty_months, margin_type, margin_value)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                         RETURNING id`,
                        [
                            id,
                            pid,
                            costPrice,
                            salePrice,
                            finalSale,
                            quantity,
                            costPrice * quantity,
                            item.warranty_months || 0,
                            item.expected_date,
                            item.supplier_warranty_months || 0,
                            item.customer_warranty_months || 0,
                            marginType,
                            marginVal
                        ]
                    );
                    poiId = newPoi.rows[0].id;
                }

                if (qtyDiff !== 0) {
                    await client.query(
                        `UPDATE products 
                         SET stock = GREATEST(0, COALESCE(stock, 0) + $1), updated_at = NOW() 
                         WHERE id = $2`,
                        [qtyDiff, pid]
                    );
                    await client.query(
                        `UPDATE stock_levels 
                         SET quantity = GREATEST(0, COALESCE(quantity, 0) + $1) 
                         WHERE product_id = $2 AND warehouse_id = 1`,
                        [qtyDiff, pid]
                    ).catch(() => null);
                }

                await client.query(
                    `UPDATE products 
                     SET purchase_price = $1, 
                         selling_price = CASE WHEN $2::numeric > 0 THEN $2::numeric ELSE selling_price END,
                         mrp = CASE WHEN $2::numeric > 0 THEN $2::numeric ELSE mrp END,
                         updated_at = NOW() 
                     WHERE id = $3`,
                    [costPrice, finalSale, pid]
                );

                if (Array.isArray(item.serials)) {
                    // Fetch existing serials for this PO item to detect edits on already-sold items
                    const existingSerialsRows = await client.query(
                        'SELECT id, serial_code FROM purchase_order_serials WHERE purchase_order_item_id = $1 ORDER BY id ASC',
                        [poiId]
                    );
                    const oldSerialsList = existingSerialsRows.rows.map(r => String(r.serial_code || '').trim()).filter(Boolean);
                    const newSerialsList = item.serials.map(s => String(s || '').trim()).filter(Boolean);

                    // If existing serials were edited and matched 1-to-1 positionally or individually
                    for (let i = 0; i < oldSerialsList.length; i++) {
                        const oldCode = oldSerialsList[i];
                        const newCode = newSerialsList[i];

                        if (oldCode && newCode && oldCode.toLowerCase() !== newCode.toLowerCase()) {
                            // Check if oldCode was sold in any active sales invoice
                            const soldCheck = await client.query(
                                `SELECT sis.id, sis.serial_code, s.invoice_no 
                                 FROM sales_item_serials sis
                                 JOIN sales_items si ON si.id = sis.sales_item_id
                                 JOIN sales s ON s.id = si.sale_id
                                 WHERE LOWER(TRIM(sis.serial_code)) = LOWER(TRIM($1))
                                   AND s.deleted_at IS NULL`,
                                [oldCode]
                            );

                            if (soldCheck.rows.length > 0) {
                                // Cascade update: Sync the updated serial code directly in sales_item_serials
                                await client.query(
                                    `UPDATE sales_item_serials 
                                     SET serial_code = $1 
                                     WHERE LOWER(TRIM(serial_code)) = LOWER(TRIM($2))`,
                                    [newCode, oldCode]
                                );
                            }
                        }
                    }

                    await client.query('DELETE FROM purchase_order_serials WHERE purchase_order_item_id = $1', [poiId]);
                    for (const s of item.serials) {
                        const trimmed = String(s || '').trim();
                        if (trimmed) {
                            await client.query(
                                'INSERT INTO purchase_order_serials (purchase_order_item_id, serial_code) VALUES ($1, $2)',
                                [poiId, trimmed]
                            );
                        }
                    }
                }
            }
        } else {
            totalCost = money(po.total_cost);
            totalSale = money(po.total_sale);
            unitCount = po.unit_count;
        }

        const targetSupplierId = req.body.supplier_id ? parseInt(req.body.supplier_id, 10) : po.supplier_id;
        const supplierRes = await client.query('SELECT id, name FROM suppliers WHERE id = $1', [targetSupplierId]);
        const supplierName = supplierRes.rows[0]?.name || 'Supplier';

        let totalPaid = money(po.total_paid);
        const { payments } = req.body;
        let appliedTenders = [];

        if (payments !== undefined) {
            // 1. Reverse all existing payments on this PO to restore previous accounts/drawers
            const existingPayments = await client.query(
                'SELECT * FROM purchase_order_payments WHERE purchase_order_id = $1',
                [id]
            );
            for (const pay of existingPayments.rows) {
                await reversePurchasePayment(client, {
                    payment: pay,
                    poNumber: po.po_number || id,
                    supplierId: po.supplier_id,
                    ledgerType: 'purchase_payment_reversal',
                    reasonNote: `PO #${po.po_number || id} edit payment reversal`,
                });
            }
            await client.query('DELETE FROM purchase_order_payments WHERE purchase_order_id = $1', [id]);
            await client.query('DELETE FROM payments WHERE purchase_id = $1', [id]).catch(() => null);

            // 2. Validate and apply new payments inside the transaction
            const tenders = Array.isArray(payments) ? payments.filter(p => money(p.amount) > 0) : [];
            totalPaid = 0;
            for (const tender of tenders) {
                totalPaid += money(tender.amount);
                await applyPurchasePayment(client, {
                    orderId: id,
                    payment: tender,
                    poNumber: po.po_number || id,
                    supplierId: targetSupplierId,
                    supplierName,
                });
            }
            appliedTenders = tenders;
        }

        const newDue = Math.max(0, totalCost - totalPaid);
        const paymentStatus = newDue === 0 ? 'PAID' : (totalPaid > 0 ? 'PARTIAL' : 'approved');

        await client.query(
            `UPDATE purchase_orders 
             SET supplier_id = $1, total_cost = $2, total_sale = $3, extra_cost = $4, extra_cost_category = $5, extra_cost_notes = $6,
                 total_paid = $7, total_due = $8, unit_count = $9, transaction_reference = $10, status = $11, updated_at = NOW()
             WHERE id = $12`,
            [
                targetSupplierId,
                totalCost,
                totalSale,
                money(extra_cost !== undefined ? extra_cost : po.extra_cost),
                extra_cost_category !== undefined ? extra_cost_category : po.extra_cost_category,
                extra_cost_notes !== undefined ? extra_cost_notes : po.extra_cost_notes,
                totalPaid,
                newDue,
                unitCount,
                transaction_reference !== undefined ? transaction_reference : po.transaction_reference,
                paymentStatus,
                id
            ]
        );

        if (targetSupplierId !== po.supplier_id) {
            if (po.supplier_id && money(po.total_due) > 0) {
                await client.query(
                    `UPDATE suppliers SET payable_balance = GREATEST(0, COALESCE(payable_balance, 0) - $1), updated_at = NOW() WHERE id = $2`,
                    [money(po.total_due), po.supplier_id]
                );
            }
            if (targetSupplierId && newDue > 0) {
                await client.query(
                    `UPDATE suppliers SET payable_balance = COALESCE(payable_balance, 0) + $1, updated_at = NOW() WHERE id = $2`,
                    [newDue, targetSupplierId]
                );
            }
        } else {
            const dueDelta = newDue - money(po.total_due);
            if (dueDelta !== 0 && po.supplier_id) {
                await client.query(
                    `UPDATE suppliers 
                     SET payable_balance = GREATEST(0, COALESCE(payable_balance, 0) + $1), updated_at = NOW()
                     WHERE id = $2`,
                    [dueDelta, po.supplier_id]
                );
            }
        }

        // Sync extra cost as expense if configured
        const effectiveExtraCost = money(extra_cost !== undefined ? extra_cost : po.extra_cost);
        if (effectiveExtraCost > 0) {
            try {
                const catName = (extra_cost_category !== undefined ? extra_cost_category : po.extra_cost_category) || 'Transportation & Logistics';
                const payeeName = supplierName || 'Supplier';
                const expNote = (extra_cost_notes !== undefined ? extra_cost_notes : po.extra_cost_notes)
                    ? `PO ${po.po_number || id} - ${(extra_cost_notes !== undefined ? extra_cost_notes : po.extra_cost_notes)}`
                    : `Purchase Order ${po.po_number || id} Extra Cost (${catName})`;
                await client.query(
                    `INSERT INTO expenses (voucher_no, category_name, amount, expense_date, payee_name, reference_no, note)
                     VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6)
                     ON CONFLICT (voucher_no) DO UPDATE 
                     SET category_name = EXCLUDED.category_name, amount = EXCLUDED.amount, note = EXCLUDED.note`,
                    [`EXP-${po.po_number || id}`, catName, effectiveExtraCost, payeeName, po.po_number || id, expNote]
                );
            } catch (expErr) {
                console.warn('Expense update for PO extra cost notice:', expErr.message);
            }
        } else if (effectiveExtraCost === 0 && money(po.extra_cost) > 0) {
            await client.query('DELETE FROM expenses WHERE voucher_no = $1', [`EXP-${po.po_number || id}`]).catch(() => null);
        }

        await client.query('COMMIT');

        res.status(200).json({
            success: true,
            message: `Purchase order #${po.po_number || id} updated successfully!`,
            data: {
                ...po,
                id: Number(id),
                supplier_id: targetSupplierId,
                total_cost: totalCost,
                total_sale: totalSale,
                total_paid: totalPaid,
                total_due: newDue,
                status: paymentStatus,
                payments: payments !== undefined ? appliedTenders : undefined,
            },
            hasSales
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('updateOrder error:', error);
        res.status(500).json({ error: error.message || 'Failed to update purchase order' });
    } finally {
        client.release();
    }
};

module.exports = { updateOrder };
