const db = require('../../config/db');
const {
  ensureProductColumns,
  formatProductResponse,
} = require('./productHelpers');

// সব প্রোডাক্ট ফেচ করা
const getAllProducts = async (req, res) => {
  try {
    await ensureProductColumns();
    const query = `
      SELECT p.*,
             CASE WHEN (p.is_serial_required IS TRUE OR p.is_serial_tracked IS TRUE) THEN true ELSE false END AS "isSerialRequired",
             CASE WHEN (p.is_serial_required IS TRUE OR p.is_serial_tracked IS TRUE) THEN true ELSE false END AS is_serial_required,
             CASE WHEN (p.is_serial_required IS TRUE OR p.is_serial_tracked IS TRUE) THEN true ELSE false END AS is_serial_tracked,
             CASE WHEN (p.is_serial_required IS TRUE OR p.is_serial_tracked IS TRUE) THEN true ELSE false END AS tracks_serial,
             CASE WHEN (p.is_warranty_required IS TRUE OR COALESCE(p.warranty_months, 0) > 0) THEN true ELSE false END AS "isWarrantyRequired",
             CASE WHEN (p.is_warranty_required IS TRUE OR COALESCE(p.warranty_months, 0) > 0) THEN true ELSE false END AS is_warranty_required,
             c.name AS category_name,
             sc.name AS sub_category_name,
             b.name AS brand_name,
             m.name AS model_name,
             s.name AS series_name,
             COALESCE((
                 SELECT poi.cost_price 
                 FROM purchase_order_items poi 
                 WHERE poi.product_id = p.id 
                 ORDER BY poi.id DESC 
                 LIMIT 1
             ), p.purchase_price, 0) AS last_purchase_price,
             (
                 SELECT poi.margin_value 
                 FROM purchase_order_items poi 
                 WHERE poi.product_id = p.id 
                 ORDER BY poi.id DESC 
                 LIMIT 1
             ) AS last_margin_value,
             COALESCE((
                 SELECT poi.margin_type 
                 FROM purchase_order_items poi 
                 WHERE poi.product_id = p.id 
                 ORDER BY poi.id DESC 
                 LIMIT 1
             ), 'percent') AS last_margin_type,
             COALESCE((
                 SELECT poi.warranty_months 
                 FROM purchase_order_items poi 
                 WHERE poi.product_id = p.id 
                 ORDER BY poi.id DESC 
                 LIMIT 1
             ), p.warranty_months, 0) AS batch_warranty_months
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
      LEFT JOIN brands b ON b.id = p.brand_id
      LEFT JOIN models m ON m.id = p.model_id
      LEFT JOIN series s ON s.id = p.series_id
      WHERE p.deleted_at IS NULL
      ORDER BY p.id DESC;
    `;
    const result = await db.query(query);

    // Fetch bundle items
    const bundleItemsRes = await db.query(`
      SELECT bi.*, p.name AS component_name, p.sku AS component_sku, p.stock AS component_stock, p.selling_price AS component_selling_price
      FROM product_bundle_items bi
      JOIN products p ON p.id = bi.product_id
      WHERE p.deleted_at IS NULL
    `).catch(() => ({ rows: [] }));

    const bundleMap = {};
    for (const row of bundleItemsRes.rows) {
      if (!bundleMap[row.bundle_id]) bundleMap[row.bundle_id] = [];
      bundleMap[row.bundle_id].push(row);
    }

    // Fetch in-stock available serials
    const serialsRes = await db.query(`
      SELECT 
          poi.product_id,
          ARRAY_AGG(pos.serial_code ORDER BY pos.id ASC) AS available_serials
      FROM purchase_order_serials pos
      JOIN purchase_order_items poi ON poi.id = pos.purchase_order_item_id
      JOIN purchase_orders po ON po.id = poi.purchase_order_id
      WHERE po.deleted_at IS NULL
        AND NOT EXISTS (
            SELECT 1 
            FROM sales_item_serials sis 
            JOIN sales_items si ON si.id = sis.sales_item_id
            LEFT JOIN sales s ON s.id = si.sale_id
            WHERE LOWER(TRIM(sis.serial_code)) = LOWER(TRIM(pos.serial_code))
              AND (s.id IS NULL OR s.deleted_at IS NULL)
        )
      GROUP BY poi.product_id;
    `).catch(() => ({ rows: [] }));
    const serialsMap = {};
    for (const row of serialsRes.rows) {
      serialsMap[row.product_id] = row.available_serials || [];
    }

    const products = result.rows.map((row) => {
      const p = formatProductResponse(row);
      p.bundle_items = bundleMap[row.id] || [];
      p.available_serials = serialsMap[row.id] || [];
      if (p.is_bundle) {
        if (p.bundle_items.length > 0) {
          const maxKits = Math.min(
            ...p.bundle_items.map((bi) => Math.floor(Number(bi.component_stock || 0) / Math.max(1, Number(bi.quantity || 1))))
          );
          p.stock = isFinite(maxKits) ? Math.max(0, maxKits) : 0;
        } else {
          p.stock = 0;
        }
      }
      return p;
    });

    return res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Fetch products error:', error);
    return res.status(500).json({ success: false, message: 'ডাটা ফেচ করতে সমস্যা হয়েছে।' });
  }
};

module.exports = {
  getAllProducts,
};
