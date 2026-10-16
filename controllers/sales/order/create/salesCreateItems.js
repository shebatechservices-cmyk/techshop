const { money } = require('../../salesHelpers');

/**
 * Inserts sales items, serial codes, and deducts inventory stock (handling bundles and unit conversion).
 */
async function insertSaleItemsAndDeductStock(client, { saleId, normalizedItems }) {
    for (const item of normalizedItems) {
        let warrantyMonths = Number(item.warranty_months || 0);
        if (warrantyMonths <= 0 && item.product_id) {
            const pRes = await client.query('SELECT warranty_months FROM products WHERE id = $1', [item.product_id]);
            if (pRes.rows.length > 0) {
                warrantyMonths = Number(pRes.rows[0].warranty_months || 0);
            }
        }
        const expireDate = warrantyMonths > 0
            ? new Date(Date.now() + warrantyMonths * 30 * 24 * 60 * 60 * 1000)
            : null;
        let itemCostPrice = money(item.cost_price);

        // Lock cost price to the exact purchase batch cost of the scanned serials
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

        const itemConvRate = Number(item.conversion_rate || 1);
        if (itemConvRate > 1 && (item.unit_type === 'sub_unit' || itemCostPrice > money(item.unit_price) * 2)) {
            itemCostPrice = money(itemCostPrice / itemConvRate);
        }

        // If product is a bundle and no explicit cost provided, compute sum of component costs
        if (itemCostPrice <= 0 && item.product_id) {
            const bCostRes = await client.query(
                `SELECT SUM(bi.quantity * COALESCE(p.purchase_price, 0)) AS total_bundle_cost
                 FROM product_bundle_items bi
                 JOIN products p ON p.id = bi.product_id
                 WHERE bi.bundle_id = $1`,
                [item.product_id]
            );
            if (bCostRes.rows[0]?.total_bundle_cost > 0) {
                itemCostPrice = money(bCostRes.rows[0].total_bundle_cost);
            }
        }

        const savedItem = await client.query(
            `INSERT INTO sales_items (sale_id, product_id, quantity, unit_price, cost_price, line_total, warranty_expire_date, warranty_months, unit_name, unit_type, conversion_rate, discount)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
            [
                saleId,
                item.product_id,
                item.quantity,
                item.unit_price,
                itemCostPrice,
                item.line_total,
                expireDate,
                warrantyMonths,
                item.unit_name || null,
                item.unit_type || 'base_unit',
                Number(item.conversion_rate || 1),
                money(item.discount || 0)
            ]
        );

        for (const serial of item.serials) {
            const trimmed = String(serial).trim();
            if (trimmed) {
                await client.query(
                    'INSERT INTO sales_item_serials (sales_item_id, serial_code) VALUES ($1, $2)',
                    [savedItem.rows[0].id, trimmed]
                );
            }
        }

        // Deduct stock for standard product or bundle components
        const prodRes = await client.query('SELECT is_bundle, conversion_rate, unit_name, sub_unit_name FROM products WHERE id = $1', [item.product_id]);
        const isBundle = Boolean(prodRes.rows[0]?.is_bundle);

        if (isBundle) {
            const bundleItemsRes = await client.query('SELECT product_id, quantity FROM product_bundle_items WHERE bundle_id = $1', [item.product_id]);
            for (const bItem of bundleItemsRes.rows) {
                const deductQty = Number(item.quantity || 1) * Number(bItem.quantity || 1);
                await client.query(
                    `UPDATE products
                     SET stock = GREATEST(0, COALESCE(stock, 0) - $1),
                         updated_at = NOW()
                     WHERE id = $2`,
                    [deductQty, bItem.product_id]
                );
                await client.query(
                    `UPDATE stock_levels
                     SET quantity = GREATEST(0, quantity - $1)
                     WHERE product_id = $2 AND warehouse_id = 1`,
                    [deductQty, bItem.product_id]
                ).catch(() => null);
            }
        } else {
            const prodData = prodRes.rows[0];
            const convRate = Number(prodData?.conversion_rate || 1);
            const isSubUnit = item.unit_type === 'sub_unit' || (prodData?.sub_unit_name && item.unit_name === prodData?.sub_unit_name);
            const deductMultiplier = isSubUnit ? 1 : (convRate > 1 ? convRate : 1);
            const deductQty = Number(item.quantity || 0) * deductMultiplier;

            await client.query(
                `UPDATE products
                 SET stock = GREATEST(0, COALESCE(stock, 0) - $1),
                     updated_at = NOW()
                 WHERE id = $2`,
                [deductQty, item.product_id]
            );
            await client.query(
                `UPDATE stock_levels
                 SET quantity = GREATEST(0, quantity - $1)
                 WHERE product_id = $2 AND warehouse_id = 1`,
                [deductQty, item.product_id]
            ).catch(() => null);
        }
    }
}

module.exports = {
    insertSaleItemsAndDeductStock,
};
