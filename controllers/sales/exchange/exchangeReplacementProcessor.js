const {
    formatProductFullName,
    normalizeSaleItems,
    validateSerialTracking,
    validateAvailableStockAndSerials,
} = require('../salesHelpers');

/**
 * Validate replacement items for serial tracking and inventory availability.
 *
 * @param {import('pg').PoolClient} client
 * @param {Array} newItems
 * @returns {Promise<{ normalizedItems: Array, calculatedSubtotal: number }>}
 */
async function validateReplacementItems(client, newItems) {
    const { normalizedItems, calculatedSubtotal } = normalizeSaleItems(newItems);
    const missingSerial = await validateSerialTracking(client, normalizedItems);
    if (missingSerial) {
        const error = new Error(`"${missingSerial.full_name || missingSerial.name || 'Product'}" is serial-tracked — attach at least one serial number.`);
        error.status = 400;
        throw error;
    }

    // Strict available stock & serial database verification
    await validateAvailableStockAndSerials(client, normalizedItems);

    return { normalizedItems, calculatedSubtotal };
}

/**
 * Insert replacement items into sales_items, record serial numbers, and deduct inventory.
 *
 * @param {import('pg').PoolClient} client
 * @param {Object} params
 * @param {number|string} params.saleId
 * @param {Array} params.normalizedItems
 * @returns {Promise<void>}
 */
async function insertReplacementItems(client, { saleId, normalizedItems }) {
    for (const item of normalizedItems) {
        const prodRes = await client.query(
            `SELECT p.*, b.name as brand_name, m.name as model_name, s.name as series_name
             FROM products p
             LEFT JOIN brands b ON b.id = p.brand_id
             LEFT JOIN models m ON m.id = p.model_id
             LEFT JOIN series s ON s.id = p.series_id
             WHERE p.id = $1`,
            [item.product_id]
        );
        const catalogProduct = prodRes.rows[0];
        const fullName = formatProductFullName(catalogProduct) || item.name || 'Product';
        const warrantyMonths = item.warranty_months !== undefined ? Number(item.warranty_months) : (catalogProduct?.warranty_months || 0);

        const expireDate = new Date();
        expireDate.setMonth(expireDate.getMonth() + Number(warrantyMonths || 0));

        let itemCostPrice = Number(item.cost_price || catalogProduct?.purchase_price || 0);
        if (Array.isArray(item.serials) && item.serials.length > 0 && item.product_id) {
            const cleanSerials = item.serials.map(s => String(s).trim().toLowerCase()).filter(Boolean);
            if (cleanSerials.length > 0) {
                const serialCostRes = await client.query(
                    `SELECT COALESCE(poi.final_cost, poi.cost_price) AS batch_cost
                     FROM purchase_order_serials pos
                     JOIN purchase_order_items poi ON poi.id = pos.purchase_order_item_id
                     JOIN purchase_orders po ON po.id = poi.purchase_order_id
                     WHERE poi.product_id = $1
                       AND LOWER(TRIM(pos.serial_code)) = ANY($2)
                       AND po.deleted_at IS NULL`,
                    [item.product_id, cleanSerials]
                );
                if (serialCostRes.rows.length > 0) {
                    const totalBatchCost = serialCostRes.rows.reduce((sum, r) => sum + Number(r.batch_cost || 0), 0);
                    itemCostPrice = Number((totalBatchCost / serialCostRes.rows.length).toFixed(2));
                }
            }
        }

        const savedItem = await client.query(
            `INSERT INTO sales_items (
                sale_id, product_id, quantity, unit_price, cost_price,
                line_total, warranty_expire_date, warranty_months
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
            [
                saleId,
                item.product_id,
                item.quantity,
                item.unit_price,
                itemCostPrice,
                item.line_total,
                expireDate,
                warrantyMonths,
            ]
        );

        if (item.serials && item.serials.length > 0) {
            for (const serial of item.serials) {
                await client.query(
                    'INSERT INTO sales_item_serials (sales_item_id, serial_code) VALUES ($1, $2)',
                    [savedItem.rows[0].id, String(serial).trim()]
                );
            }
        }

        await client.query(
            `UPDATE products
             SET stock = GREATEST(0, COALESCE(stock, 0) - $1),
                 updated_at = NOW()
             WHERE id = $2`,
            [item.quantity, item.product_id]
        );
        await client.query(
            `UPDATE stock_levels
             SET quantity = GREATEST(0, quantity - $1)
             WHERE product_id = $2 AND warehouse_id = 1`,
            [item.quantity, item.product_id]
        );
    }
}

module.exports = {
    validateReplacementItems,
    insertReplacementItems,
};
