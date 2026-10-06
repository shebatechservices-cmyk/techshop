const pool = require("../../config/db");
const { allowedEntities, ensureMasterSchema, formatProductResponse } = require("./masterHelpers");

const buildFilters = (entity, query) => {
    const filters = [];
    const params = [];
    let index = 1;

    const toValidId = (val) => {
        if (val === undefined || val === null) return null;
        const str = String(val).trim();
        if (!str || str === 'undefined' || str === 'null' || str === 'NaN') return null;
        const parsed = parseInt(str, 10);
        return isNaN(parsed) ? null : parsed;
    };

    if (entity === 'products') {
        filters.push('p.deleted_at IS NULL');
    } else {
        filters.push('deleted_at IS NULL');
    }

    const categoryId = toValidId(query.category_id);
    const subCategoryId = toValidId(query.sub_category_id);
    const brandId = toValidId(query.brand_id);
    const modelId = toValidId(query.model_id);
    const seriesId = toValidId(query.series_id);

    if (entity === 'sub_categories' && categoryId !== null) {
        filters.push(`category_id = $${index}`);
        params.push(categoryId);
        index += 1;
    }

    if (entity === 'product_names') {
        if (brandId !== null) {
            filters.push(`brand_id = $${index}`);
            params.push(brandId);
            index += 1;
        }
        if (subCategoryId !== null) {
            filters.push(`sub_category_id = $${index}`);
            params.push(subCategoryId);
            index += 1;
        }
        if (categoryId !== null) {
            filters.push(`category_id = $${index}`);
            params.push(categoryId);
            index += 1;
        }
    }

    if (entity === 'models') {
        if (brandId !== null) {
            filters.push(`brand_id = $${index}`);
            params.push(brandId);
            index += 1;
        }
        if (categoryId !== null) {
            filters.push(`category_id = $${index}`);
            params.push(categoryId);
            index += 1;
        }
        if (subCategoryId !== null) {
            filters.push(`sub_category_id = $${index}`);
            params.push(subCategoryId);
            index += 1;
        }
    }

    if (entity === 'brands' && subCategoryId !== null) {
        // Brands are globally unique catalog entities usable across multiple subcategories
    }

    if (entity === 'series') {
        if (brandId !== null) {
            filters.push(`brand_id = $${index}`);
            params.push(brandId);
            index += 1;
        }
        if (modelId !== null) {
            filters.push(`model_id = $${index}`);
            params.push(modelId);
            index += 1;
        }
    }

    if (entity === 'products') {
        if (categoryId !== null) {
            filters.push(`p.category_id = $${index}`);
            params.push(categoryId);
            index += 1;
        }
        if (subCategoryId !== null) {
            filters.push(`p.sub_category_id = $${index}`);
            params.push(subCategoryId);
            index += 1;
        }
        if (brandId !== null) {
            filters.push(`p.brand_id = $${index}`);
            params.push(brandId);
            index += 1;
        }
        if (modelId !== null) {
            filters.push(`p.model_id = $${index}`);
            params.push(modelId);
            index += 1;
        }
        if (seriesId !== null) {
            filters.push(`p.series_id = $${index}`);
            params.push(seriesId);
            index += 1;
        }
        if (query.status && query.status !== 'undefined' && query.status !== 'null') {
            filters.push(`p.status = $${index}`);
            params.push(query.status);
            index += 1;
        }
    }

    return { filters, params };
};

// 1. List entities (GET)
const getAll = async (req, res) => {
    const { entity } = req.params;
    if (!allowedEntities.includes(entity)) return res.status(400).json({ error: 'Invalid entity' });

    try {
        await ensureMasterSchema();
        const { filters, params } = buildFilters(entity, req.query);
        let query = entity === 'products'
            ? `SELECT p.*,
                      CASE WHEN (p.is_serial_required IS TRUE OR p.is_serial_tracked IS TRUE) THEN true ELSE false END AS "isSerialRequired",
                      CASE WHEN (p.is_serial_required IS TRUE OR p.is_serial_tracked IS TRUE) THEN true ELSE false END AS is_serial_required,
                      CASE WHEN (p.is_serial_required IS TRUE OR p.is_serial_tracked IS TRUE) THEN true ELSE false END AS is_serial_tracked,
                      CASE WHEN (p.is_serial_required IS TRUE OR p.is_serial_tracked IS TRUE) THEN true ELSE false END AS tracks_serial,
                      CASE WHEN (p.is_warranty_required IS TRUE OR COALESCE(p.warranty_months, 0) > 0) THEN true ELSE false END AS "isWarrantyRequired",
                      CASE WHEN (p.is_warranty_required IS TRUE OR COALESCE(p.warranty_months, 0) > 0) THEN true ELSE false END AS is_warranty_required,
                      c.name AS category_name, sc.name AS sub_category_name,
                      b.name AS brand_name, m.name AS model_name, s.name AS series_name,
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
               LEFT JOIN series s ON s.id = p.series_id`
            : `SELECT * FROM ${entity}`;

        if (filters.length > 0) {
            query += ` WHERE ${filters.join(' AND ')}`;
        }

        const hasNameColumn = ['categories', 'sub_categories', 'brands', 'models', 'series', 'product_names'].includes(entity);
        query += entity === 'products'
            ? ' ORDER BY p.id ASC'
            : hasNameColumn
            ? ' ORDER BY LOWER(name) ASC, name ASC'
            : ' ORDER BY id ASC';
        const result = await pool.query(query, params);
        if (entity === 'products') {
            const bundleItemsRes = await pool.query(`
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

            // Fetch available (in-stock) serial numbers for products
            const serialsRes = await pool.query(`
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

            const rows = result.rows.map((row) => {
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
            return res.status(200).json(rows);
        }
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(`[masterReadController error]:`, error);
        res.status(500).json({ error: error.message || 'Server error!' });
    }
};

module.exports = { getAll };
