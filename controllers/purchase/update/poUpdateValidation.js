/**
 * Purchase Order Update Validation
 * Handles 15-day editability window checks, sold item tracking,
 * and payload item/serial uniqueness validation.
 */

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

module.exports = {
    checkPoEditabilityAndSoldItems,
    validatePayloadItemsAndSerials,
};
