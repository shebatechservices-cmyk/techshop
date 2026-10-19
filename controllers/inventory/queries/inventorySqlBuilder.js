function buildInventoryQuery({ category_id }) {
    let query = `
        SELECT 
            p.id,
            p.name,
            p.short_name,
            p.sku,
            p.barcode,
            p.description,
            p.category_id,
            c.name AS category_name,
            p.sub_category_id,
            sc.name AS sub_category_name,
            p.brand_id,
            b.name AS brand_name,
            p.model_id,
            m.name AS model_name,
            p.series_id,
            s.name AS series_name,
            p.unit_name,
            p.sub_unit_name,
            p.conversion_rate,
            p.sub_unit_selling_price,
            p.is_serial_tracked,
            p.is_serial_required,
            COALESCE(NULLIF(p.purchase_price, 0), (
                SELECT poi.cost_price 
                FROM purchase_order_items poi 
                JOIN purchase_orders po ON po.id = poi.purchase_order_id 
                WHERE poi.product_id = p.id AND po.deleted_at IS NULL 
                ORDER BY po.created_at DESC 
                LIMIT 1
            ), 0) AS cost_price,
            COALESCE(NULLIF(p.selling_price, 0), (
                SELECT COALESCE(NULLIF(poi.final_sale_price, 0), poi.sale_price)
                FROM purchase_order_items poi 
                JOIN purchase_orders po ON po.id = poi.purchase_order_id 
                WHERE poi.product_id = p.id AND po.deleted_at IS NULL 
                ORDER BY po.created_at DESC 
                LIMIT 1
            ), p.purchase_price, 0) AS sale_price,
            COALESCE(p.mrp, 0) AS mrp,
            COALESCE(p.stock, 0) AS stock,
            COALESCE(p.min_stock, 5) AS min_stock,
            COALESCE(p.warranty_months, 0) AS warranty_months,
            p.supplier_warranty_expire_date,
            p.purchased_at,
            (
                SELECT po.created_at 
                FROM purchase_order_items poi 
                JOIN purchase_orders po ON po.id = poi.purchase_order_id 
                WHERE poi.product_id = p.id AND po.deleted_at IS NULL 
                ORDER BY po.created_at DESC 
                LIMIT 1
            ) AS latest_purchase_date,
            COALESCE((
                SELECT poi.warranty_months 
                FROM purchase_order_items poi 
                JOIN purchase_orders po ON po.id = poi.purchase_order_id 
                WHERE poi.product_id = p.id AND po.deleted_at IS NULL 
                ORDER BY po.created_at DESC 
                LIMIT 1
            ), p.warranty_months, 0) AS supplier_warranty_months,
            p.status,
            p.image_url,
            COALESCE(p.is_ecommerce_active, true) AS is_ecommerce_active,
            COALESCE(p.purchase_count, 0) AS purchase_count,
            COALESCE((
                SELECT SUM(poi.quantity) 
                FROM purchase_order_items poi 
                JOIN purchase_orders po ON po.id = poi.purchase_order_id
                WHERE poi.product_id = p.id AND po.deleted_at IS NULL
            ), 0) AS total_inflow_units,
            COALESCE((
                SELECT COUNT(*) 
                FROM purchase_order_serials pos
                JOIN purchase_order_items poi ON poi.id = pos.purchase_order_item_id
                JOIN purchase_orders po ON po.id = poi.purchase_order_id
                WHERE poi.product_id = p.id AND po.deleted_at IS NULL
            ), 0) AS total_serials_count,
            COALESCE((
                SELECT COUNT(*)
                FROM sales_items si
                WHERE si.product_id = p.id
            ), 0) AS total_sold_units
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
        LEFT JOIN brands b ON b.id = p.brand_id
        LEFT JOIN models m ON m.id = p.model_id
        LEFT JOIN series s ON s.id = p.series_id
        WHERE p.deleted_at IS NULL
          AND (
            COALESCE(p.stock, 0) > 0 
            OR COALESCE(p.purchase_count, 0) > 0 
            OR EXISTS (
                SELECT 1 
                FROM purchase_order_items poi 
                JOIN purchase_orders po ON po.id = poi.purchase_order_id
                WHERE poi.product_id = p.id AND po.deleted_at IS NULL
            )
          )
    `;

    const conditions = [];
    const params = [];
    let pIndex = 1;

    if (category_id) {
        conditions.push(`p.category_id = $${pIndex++}`);
        params.push(Number(category_id));
    }

    if (conditions.length > 0) {
        query += ` AND ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY p.id DESC`;

    return { query, params };
}

module.exports = {
    buildInventoryQuery,
};
