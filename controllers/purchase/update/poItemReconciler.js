const { money } = require('../helpers/purchaseCoreHelpers');

/**
 * Reconciles line items by handling deletions, updates, additions,
 * stock increments/decrements, price updates, and serial cascade updates.
 */
const reconcilePurchaseOrderItems = async (client, { id, items, soldProductMap, effectiveDiscount }) => {
    const existingPoiRes = await client.query('SELECT * FROM purchase_order_items WHERE purchase_order_id = $1', [id]);
    const existingPoiMap = new Map(existingPoiRes.rows.map(r => [Number(r.id), r]));
    const newItemIds = new Set(items.map(it => it.id ? Number(it.id) : null).filter(Boolean));

    // 1. Remove deleted items and reverse their stock allocations
    for (const [oldPoiId, oldPoi] of existingPoiMap.entries()) {
        if (!newItemIds.has(oldPoiId)) {
            const oldPid = Number(oldPoi.product_id);
            if (soldProductMap.has(oldPid)) {
                throw Object.assign(
                    new Error(`Cannot remove product ID ${oldPid} from purchase order because units from this PO have already been sold.`),
                    { status: 400 }
                );
            }
            const pInfo = await client.query('SELECT conversion_rate, unit_name, sub_unit_name FROM products WHERE id = $1', [oldPid]);
            const convRate = Number(pInfo.rows[0]?.conversion_rate || 1);
            const isSubUnit = oldPoi.unit_type === 'sub_unit' || (pInfo.rows[0]?.sub_unit_name && (oldPoi.unit === pInfo.rows[0]?.sub_unit_name || oldPoi.unit_name === pInfo.rows[0]?.sub_unit_name));
            const decrementQty = isSubUnit ? Number(oldPoi.quantity || 0) : Number(oldPoi.quantity || 0) * (convRate > 1 ? convRate : 1);

            await client.query(
                `UPDATE products 
                 SET stock = GREATEST(0, COALESCE(stock, 0) - $1), 
                     purchase_count = GREATEST(0, COALESCE(purchase_count, 0) - 1),
                     updated_at = NOW() 
                 WHERE id = $2`,
                [decrementQty, oldPid]
            );
            await client.query(
                `UPDATE stock_levels 
                 SET quantity = GREATEST(0, COALESCE(quantity, 0) - $1) 
                 WHERE product_id = $2 AND warehouse_id = 1`,
                [decrementQty, oldPid]
            ).catch(() => null);

            await client.query('DELETE FROM purchase_order_serials WHERE purchase_order_item_id = $1', [oldPoiId]);
            await client.query('DELETE FROM purchase_order_items WHERE id = $1', [oldPoiId]);
        }
    }

    // 2. Insert or update line items
    let itemsCost = 0;
    let totalSale = 0;
    let unitCount = 0;

    for (const item of items) {
        const pid = parseInt(item.product_id, 10);
        const costPrice = money(item.cost_price);
        const salePrice = money(item.sale_price);
        const finalSale = money(item.final_sale_price || item.sale_price);
        const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);

        if (soldProductMap.has(pid)) {
            const minAllowed = soldProductMap.get(pid);
            if (quantity < minAllowed) {
                throw Object.assign(
                    new Error(`Quantity for product ID ${pid} cannot be less than ${minAllowed} because ${minAllowed} unit(s) have already been sold.`),
                    { status: 400 }
                );
            }
        }

        itemsCost += costPrice * quantity;
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

        const finalCost = money(item.final_cost || costPrice);

        if (oldPoi) {
            await client.query(
                `UPDATE purchase_order_items 
                 SET cost_price = $1, sale_price = $2, final_sale_price = $3, quantity = $4, line_total = $5,
                     warranty_months = $6, expected_date = $7, supplier_warranty_months = $8, customer_warranty_months = $9,
                     margin_type = $10, margin_value = $11, final_cost = $12, updated_at = NOW()
                 WHERE id = $13`,
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
                    finalCost,
                    poiId
                ]
            );
        } else {
            const newPoi = await client.query(
                `INSERT INTO purchase_order_items 
                 (purchase_order_id, product_id, cost_price, sale_price, final_sale_price, quantity, line_total, warranty_months, expected_date, supplier_warranty_months, customer_warranty_months, margin_type, margin_value, final_cost)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
                    marginVal,
                    finalCost
                ]
            );
            poiId = newPoi.rows[0].id;
        }

        if (qtyDiff !== 0) {
            const pInfo = await client.query('SELECT conversion_rate, unit_name, sub_unit_name FROM products WHERE id = $1', [pid]);
            const convRate = Number(pInfo.rows[0]?.conversion_rate || 1);
            const isSubUnit = item.unit_type === 'sub_unit' || (pInfo.rows[0]?.sub_unit_name && (item.unit === pInfo.rows[0]?.sub_unit_name || item.unit_name === pInfo.rows[0]?.sub_unit_name));
            const effectiveDiff = isSubUnit ? qtyDiff : qtyDiff * (convRate > 1 ? convRate : 1);

            await client.query(
                `UPDATE products 
                 SET stock = GREATEST(0, COALESCE(stock, 0) + $1), updated_at = NOW() 
                 WHERE id = $2`,
                [effectiveDiff, pid]
            );
            await client.query(
                `UPDATE stock_levels 
                 SET quantity = GREATEST(0, COALESCE(quantity, 0) + $1) 
                 WHERE product_id = $2 AND warehouse_id = 1`,
                [effectiveDiff, pid]
            ).catch(() => null);
        }

        const itemFinalCost = Number(finalCost || costPrice) || 0;
        await client.query(
            `UPDATE products 
             SET purchase_price = COALESCE((
                     SELECT COALESCE(NULLIF(poi.final_cost, 0), poi.cost_price)
                     FROM purchase_order_items poi
                     JOIN purchase_orders po ON po.id = poi.purchase_order_id
                     WHERE poi.product_id = $1 AND po.deleted_at IS NULL
                     ORDER BY po.created_at DESC, poi.id DESC
                     LIMIT 1
                 ), $2::numeric),
                 selling_price = CASE WHEN $3::numeric > 0 THEN $3::numeric ELSE selling_price END,
                 mrp = CASE WHEN $3::numeric > 0 THEN $3::numeric ELSE mrp END,
                 updated_at = NOW() 
             WHERE id = $1`,
            [pid, itemFinalCost, finalSale]
        );

        if (Array.isArray(item.serials)) {
            const existingSerialsRows = await client.query(
                'SELECT id, serial_code FROM purchase_order_serials WHERE purchase_order_item_id = $1 ORDER BY id ASC',
                [poiId]
            );
            const oldSerialsList = existingSerialsRows.rows.map(r => String(r.serial_code || '').trim()).filter(Boolean);
            const newSerialsList = item.serials.map(s => String(s || '').trim()).filter(Boolean);

            for (let i = 0; i < oldSerialsList.length; i++) {
                const oldCode = oldSerialsList[i];
                const newCode = newSerialsList[i];

                if (oldCode && newCode && oldCode.toLowerCase() !== newCode.toLowerCase()) {
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

    const totalCost = Math.max(0, itemsCost - effectiveDiscount);
    return { itemsCost, totalCost, totalSale, unitCount };
};

module.exports = {
    reconcilePurchaseOrderItems,
};
