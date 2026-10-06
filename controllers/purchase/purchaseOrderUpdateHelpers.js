const {
    money,
    reversePurchasePayment,
    applyPurchasePayment,
} = require("./purchaseHelpers");

/**
 * Checks whether the PO is within the allowed 15-day edit window
 * and maps all units that have already been sold (both serial-tracked and non-serial).
 */
const checkPoEditabilityAndSoldItems = async (client, po, id) => {
    const createdAt = new Date(po.created_at || Date.now());
    const hoursOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursOld > 360) {
        throw Object.assign(
            new Error(`Cannot edit purchase order: PO #${po.po_number || id} was created ${Math.floor(hoursOld / 24)} days ago. Edits are only permitted within 15 days (360 hours) of creation.`),
            { status: 400 }
        );
    }

    // 1. Serials sold specifically from this purchase order
    const serialSalesCheck = await client.query(`
        SELECT poi.product_id, COUNT(DISTINCT sis.id) as sold_count
        FROM purchase_order_items poi
        JOIN purchase_order_serials pos ON pos.purchase_order_item_id = poi.id
        JOIN sales_item_serials sis ON LOWER(TRIM(sis.serial_code)) = LOWER(TRIM(pos.serial_code))
        JOIN sales_items si ON si.id = sis.sales_item_id
        JOIN sales s ON s.id = si.sale_id
        WHERE poi.purchase_order_id = $1 
          AND s.deleted_at IS NULL
        GROUP BY poi.product_id
    `, [id]).catch(() => ({ rows: [] }));

    // 2. Non-serial products stock check for items in this PO
    const nonSerialCheck = await client.query(`
        SELECT poi.product_id, poi.quantity as po_qty, p.stock as current_stock, p.is_serial_tracked,
               p.conversion_rate, p.unit_name, p.sub_unit_name
        FROM purchase_order_items poi
        JOIN products p ON p.id = poi.product_id
        WHERE poi.purchase_order_id = $1
    `, [id]).catch(() => ({ rows: [] }));

    const soldProductMap = new Map();
    serialSalesCheck.rows.forEach(r => {
        const pid = Number(r.product_id);
        const count = Number(r.sold_count || 0);
        if (count > 0) soldProductMap.set(pid, count);
    });

    nonSerialCheck.rows.forEach(r => {
        const pid = Number(r.product_id);
        if (!r.is_serial_tracked && !soldProductMap.has(pid)) {
            const convRate = Number(r.conversion_rate || 1);
            const multiplier = convRate > 1 ? convRate : 1;
            
            const poStockQty = Number(r.po_qty || 0) * multiplier;
            const stock = Number(r.current_stock || 0);
            const soldInStockUnits = Math.max(0, poStockQty - stock);
            const soldInPoUnits = Math.ceil(soldInStockUnits / multiplier);
            if (soldInPoUnits > 0) {
                soldProductMap.set(pid, soldInPoUnits);
            }
        }
    });

    const hasSales = soldProductMap.size > 0;
    return { soldProductMap, hasSales };
};

/**
 * Validates payload line items for intra-payload duplicate product IDs,
 * duplicate serial numbers, and conflicts with active inventory serials in other POs.
 */
const validatePayloadItemsAndSerials = async (client, items, id) => {
    if (!Array.isArray(items) || items.length === 0) return;

    const seenPids = new Set();
    const allPayloadSerials = [];

    for (const item of items) {
        const pid = parseInt(item.product_id, 10);
        if (seenPids.has(pid)) {
            throw Object.assign(new Error('The same item cannot be added twice in a purchase order.'), { status: 400 });
        }
        seenPids.add(pid);

        if (Array.isArray(item.serials)) {
            for (const s of item.serials) {
                const trimmed = String(s || '').trim();
                if (trimmed) {
                    const lower = trimmed.toLowerCase();
                    if (allPayloadSerials.includes(lower)) {
                        throw Object.assign(
                            new Error(`Duplicate serial/barcode "${trimmed}" found within this purchase order submission`),
                            { status: 400 }
                        );
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
            throw Object.assign(
                new Error(`The following serial(s)/barcode(s) already exist in Inventory: ${duplicates}`),
                { status: 400 }
            );
        }
    }
};

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
             SET purchase_price = $1, 
                 selling_price = CASE WHEN $2::numeric > 0 THEN $2::numeric ELSE selling_price END,
                 mrp = CASE WHEN $2::numeric > 0 THEN $2::numeric ELSE mrp END,
                 updated_at = NOW() 
             WHERE id = $3`,
            [itemFinalCost, finalSale, pid]
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

/**
 * Reconciles payments, reversing previous tenders if needed, applying new tenders,
 * and calculating final balances and payment status.
 */
const reconcilePurchaseOrderPayments = async (client, { id, po, payments, targetSupplierId, supplierName, totalCost }) => {
    let totalPaid = money(po.total_paid);
    let appliedTenders = [];

    if (payments !== undefined) {
        // 1. Reverse all existing payments on this PO
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

        // 2. Validate and apply new payments
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

    return { totalPaid, newDue, paymentStatus, appliedTenders };
};

module.exports = {
    checkPoEditabilityAndSoldItems,
    validatePayloadItemsAndSerials,
    reconcilePurchaseOrderItems,
    reconcilePurchaseOrderPayments,
};
