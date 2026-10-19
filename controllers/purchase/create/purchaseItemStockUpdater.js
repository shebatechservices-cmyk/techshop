const { money } = require('../purchaseHelpers');

async function saveOrderItemsAndStock(client, orderId, normalizedItems) {
    for (const item of normalizedItems) {
        const product = await client.query(
            'SELECT id, conversion_rate, unit_name, sub_unit_name FROM products WHERE id = $1',
            [item.product_id]
        );
        if (!product.rows.length) {
            throw Object.assign(new Error('A product was not found'), { status: 400 });
        }
        const prodData = product.rows[0];
        const convRate = Number(prodData?.conversion_rate || 1);
        const isSubUnit = item.unit_type === 'sub_unit' || (prodData?.sub_unit_name && item.unit === prodData?.sub_unit_name);
        const stockIncrement = isSubUnit ? (Number(item.quantity) || 1) : (Number(item.quantity) || 1) * (convRate > 1 ? convRate : 1);

        let supplierWarrantyExpireDate = null;
        const supplierWarrantyMonths = Math.max(
            0,
            parseInt(
                item.supplier_warranty_months !== undefined && item.supplier_warranty_months !== null
                    ? item.supplier_warranty_months
                    : item.warranty_months,
                10
            ) || 0
        );
        const customerWarrantyMonths = Math.max(
            0,
            parseInt(
                item.customer_warranty_months !== undefined && item.customer_warranty_months !== null
                    ? item.customer_warranty_months
                    : item.warranty_months,
                10
            ) || 0
        );
        const baseDateStr = item.expected_date || new Date().toISOString().split('T')[0];
        if (supplierWarrantyMonths > 0 && baseDateStr) {
            const baseDate = new Date(baseDateStr);
            if (!isNaN(baseDate.getTime())) {
                const expDate = new Date(baseDate);
                expDate.setMonth(expDate.getMonth() + supplierWarrantyMonths);
                supplierWarrantyExpireDate = expDate.toISOString().split('T')[0];
            }
        }

        const savedItem = await client.query(
            `INSERT INTO purchase_order_items (
                purchase_order_id, product_id, quantity, cost_price, sale_price,
                margin_type, margin_value, final_sale_price, line_total,
                expected_date, warranty_months, sort_order, supplier_warranty_expire_date,
                supplier_warranty_months, customer_warranty_months, final_cost
             ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
              RETURNING id`,
            [
                orderId,
                item.product_id,
                item.quantity,
                item.cost_price,
                item.sale_price,
                item.margin_type,
                item.margin_value,
                item.final_sale_price,
                item.line_total,
                item.expected_date,
                customerWarrantyMonths,
                item.sort_order,
                supplierWarrantyExpireDate,
                supplierWarrantyMonths,
                customerWarrantyMonths,
                item.final_cost || item.cost_price,
            ]
        );

        for (const serial of item.serials) {
            await client.query(
                'INSERT INTO purchase_order_serials (purchase_order_item_id, serial_code) VALUES ($1, $2)',
                [savedItem.rows[0].id, String(serial).trim()]
            );
        }

        const itemCostPrice = money(item.cost_price);
        const itemSalePrice = money(item.final_sale_price || item.sale_price);

        await client.query(
            `UPDATE products
             SET stock = COALESCE(stock, 0) + $1,
                 purchase_count = COALESCE(purchase_count, 0) + 1,
                 purchased_at = NOW(),
                 purchase_price = $6::numeric,
                 selling_price = CASE WHEN $7::numeric > 0 THEN $7::numeric ELSE selling_price END,
                 mrp = CASE WHEN $7::numeric > 0 THEN $7::numeric ELSE mrp END,
                 supplier_warranty_expire_date = COALESCE($2::date, supplier_warranty_expire_date),
                 warranty_months = CASE WHEN $3::int > 0 THEN $3::int ELSE warranty_months END,
                 barcode = CASE WHEN COALESCE(NULLIF(barcode, ''), '') = '' THEN $5::text ELSE barcode END,
                 updated_at = NOW()
             WHERE id = $4::int`,
            [
                stockIncrement,
                supplierWarrantyExpireDate || null,
                customerWarrantyMonths,
                Number(item.product_id) || 0,
                item.serials.length > 0 ? String(item.serials[0]).trim() : null,
                itemCostPrice,
                itemSalePrice,
            ]
        );

        await client.query(
            `INSERT INTO stock_levels (product_id, warehouse_id, quantity)
             VALUES ($1, 1, $2)
             ON CONFLICT (product_id, warehouse_id)
             DO UPDATE SET quantity = stock_levels.quantity + EXCLUDED.quantity`,
            [Number(item.product_id) || 0, stockIncrement]
        ).catch(() => null);
    }
}

module.exports = {
    saveOrderItemsAndStock,
};
