const pool = require("../../config/db");
const { allowedEntities, ensureMasterSchema, parseBool, formatProductResponse } = require("./masterHelpers");

const create = async (req, res) => {
    const { entity } = req.params;
    if (!allowedEntities.includes(entity)) return res.status(400).json({ error: 'Invalid entity' });

    try {
        const {
            name,
            category_id,
            sub_category_id,
            brand_id,
            model_id,
            series_id,
            sku,
            barcode,
            short_name,
            description,
            purchase_price,
            selling_price,
            mrp,
            stock,
            min_stock,
            location,
            warranty_months,
            status,
            image_url,
            is_featured,
            supplier_name,
            supplier_phone
        } = req.body;

        const safeNum = (v, defaultVal = 0) => {
            if (v === undefined || v === null || v === '' || v === 'null') return defaultVal;
            const n = Number(v);
            return isNaN(n) ? defaultVal : n;
        };
        const safeIntOrNull = (v) => {
            if (v === undefined || v === null || v === '' || v === 'null') return null;
            const n = parseInt(v, 10);
            return isNaN(n) ? null : n;
        };
        const safeNumOrNull = (v) => {
            if (v === undefined || v === null || v === '' || v === 'null') return null;
            const n = Number(v);
            return isNaN(n) ? null : n;
        };
        const safeStrOrNull = (v) => {
            if (v === undefined || v === null) return null;
            const s = String(v).trim();
            return s === '' || s === 'null' ? null : s;
        };

        const trimmedName = String(name || '').trim();
        if (entity !== 'products' && !trimmedName) {
            return res.status(400).json({ error: 'Name is required' });
        }

        await ensureMasterSchema();
        let result;

        if (entity === 'sub_categories') {
            const catId = safeIntOrNull(category_id);
            if (!catId) {
                return res.status(400).json({ error: 'Please select a category' });
            }
            const existing = await pool.query(
                'SELECT * FROM sub_categories WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) AND category_id = $2 LIMIT 1',
                [trimmedName, catId]
            );
            if (existing.rows.length > 0) {
                result = existing;
            } else {
                result = await pool.query(
                    'INSERT INTO sub_categories (name, category_id) VALUES ($1, $2) RETURNING *',
                    [trimmedName, catId]
                );
            }
        } else if (entity === 'series') {
            const brId = safeIntOrNull(brand_id);
            const moId = safeIntOrNull(model_id);
            const existing = await pool.query(
                'SELECT * FROM series WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) AND brand_id = $2 LIMIT 1',
                [trimmedName, brId]
            );
            if (existing.rows.length > 0) {
                result = existing;
            } else {
                result = await pool.query(
                    `INSERT INTO series (name, brand_id, model_id)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (name, brand_id) DO UPDATE SET model_id = COALESCE(series.model_id, EXCLUDED.model_id)
                     RETURNING *`,
                    [trimmedName, brId, moId]
                );
            }
        } else if (entity === 'models') {
            const brId = safeIntOrNull(brand_id);
            const catId = safeIntOrNull(category_id);
            const subCatId = safeIntOrNull(sub_category_id);
            const existing = await pool.query(
                'SELECT * FROM models WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) AND brand_id = $2 LIMIT 1',
                [trimmedName, brId]
            );
            if (existing.rows.length > 0) {
                result = existing;
            } else {
                result = await pool.query(
                    'INSERT INTO models (name, brand_id, category_id, sub_category_id) VALUES ($1, $2, $3, $4) RETURNING *',
                    [trimmedName, brId, catId, subCatId]
                );
            }
        } else if (entity === 'products') {
            const catId = safeIntOrNull(category_id);
            const subCatId = safeIntOrNull(sub_category_id);
            const brId = safeIntOrNull(brand_id);
            const moId = safeIntOrNull(model_id);
            const seId = safeIntOrNull(series_id);

            const dupCheck = await pool.query(
                `SELECT id FROM products 
                 WHERE deleted_at IS NULL AND (
                   ($1::text IS NOT NULL AND TRIM(sku) = TRIM($1)) OR
                   ($2::text IS NOT NULL AND TRIM(barcode) = TRIM($2)) OR
                   (
                     LOWER(TRIM(name)) = LOWER(TRIM($3)) AND 
                     category_id IS NOT DISTINCT FROM $4 AND 
                     sub_category_id IS NOT DISTINCT FROM $5 AND 
                     brand_id IS NOT DISTINCT FROM $6 AND 
                     model_id IS NOT DISTINCT FROM $7 AND 
                     series_id IS NOT DISTINCT FROM $8
                   )
                 )
                 LIMIT 1`,
                [
                    safeStrOrNull(sku),
                    safeStrOrNull(barcode),
                    safeStrOrNull(name) || '',
                    catId,
                    subCatId,
                    brId,
                    moId,
                    seId,
                ]
            );
            if (dupCheck.rows.length > 0) {
                return res.status(409).json({
                    error: 'Already added this product, add a new product for catalog'
                });
            }

            const isSerialReq = Boolean(
                parseBool(req.body.is_serial_required) ??
                parseBool(req.body.isSerialRequired) ??
                parseBool(req.body.is_serial_tracked) ??
                parseBool(req.body.tracks_serial) ??
                false
            );
            const isWarrantyReq = Boolean(
                parseBool(req.body.is_warranty_required) ??
                parseBool(req.body.isWarrantyRequired) ??
                (safeNum(warranty_months || req.body.warranty_months, 0) > 0)
            );
            const isBundleVal = Boolean(
                parseBool(req.body.is_bundle) ??
                parseBool(req.body.isBundle) ??
                false
            );

            result = await pool.query(
                `INSERT INTO products (
                    name, category_id, sub_category_id, brand_id, model_id, series_id,
                    sku, barcode, short_name, description,
                    purchase_price, selling_price, mrp, stock, min_stock,
                    location, warranty_months, status, image_url, is_featured,
                    supplier_name, supplier_phone, is_serial_tracked, is_serial_required, is_warranty_required,
                    is_bundle, unit_name, sub_unit_name, conversion_rate, sub_unit_selling_price, sub_unit_barcode
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31)
                RETURNING *`,
                [
                    safeStrOrNull(name),
                    catId,
                    subCatId,
                    brId,
                    moId,
                    seId,
                    safeStrOrNull(sku),
                    safeStrOrNull(barcode),
                    safeStrOrNull(short_name),
                    safeStrOrNull(description),
                    safeNum(purchase_price, 0),
                    safeNum(selling_price, 0),
                    safeNum(mrp, 0),
                    safeNum(stock, 0),
                    safeNum(min_stock, 0),
                    safeStrOrNull(location),
                    safeIntOrNull(warranty_months) || 0,
                    safeStrOrNull(status) || 'active',
                    safeStrOrNull(image_url),
                    Boolean(parseBool(is_featured) ?? false),
                    safeStrOrNull(supplier_name),
                    safeStrOrNull(supplier_phone),
                    isSerialReq,
                    isSerialReq,
                    isWarrantyReq,
                    isBundleVal,
                    safeStrOrNull(req.body.unit_name) || 'Pcs',
                    safeStrOrNull(req.body.sub_unit_name),
                    safeNum(req.body.conversion_rate, 1),
                    safeNumOrNull(req.body.sub_unit_selling_price),
                    safeStrOrNull(req.body.sub_unit_barcode),
                ]
            );

            const createdProd = result.rows[0];
            const rawBundleItems = req.body.bundle_items !== undefined ? req.body.bundle_items : req.body.bundleItems;
            if (isBundleVal && rawBundleItems) {
                let parsed = [];
                try {
                    parsed = typeof rawBundleItems === 'string' ? (rawBundleItems.trim() ? JSON.parse(rawBundleItems) : []) : (Array.isArray(rawBundleItems) ? rawBundleItems : []);
                } catch {
                    parsed = [];
                }
                for (const bi of parsed) {
                    if (bi && bi.product_id) {
                        await pool.query(
                            `INSERT INTO product_bundle_items (bundle_id, product_id, quantity, unit_price)
                             VALUES ($1, $2, $3, $4)`,
                            [createdProd.id, Number(bi.product_id), Number(bi.quantity || 1), Number(bi.unit_price || 0)]
                        );
                    }
                }
                createdProd.bundle_items = parsed;
            }
        } else if (entity === 'product_names') {
            const brId = safeIntOrNull(brand_id);
            const catId = safeIntOrNull(category_id);
            const subCatId = safeIntOrNull(sub_category_id);
            result = await pool.query(
                `INSERT INTO product_names (name, brand_id, category_id, sub_category_id)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT DO NOTHING
                 RETURNING *`,
                [trimmedName, brId, catId, subCatId]
            );
            if (!result.rows.length) {
                result = await pool.query(
                    'SELECT * FROM product_names WHERE name = $1 LIMIT 1',
                    [trimmedName]
                );
            }
        } else if (entity === 'brands') {
            const subCatId = safeIntOrNull(sub_category_id);
            const existing = await pool.query(
                'SELECT * FROM brands WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) LIMIT 1',
                [trimmedName]
            );
            if (existing.rows.length > 0) {
                result = existing;
            } else {
                result = await pool.query(
                    `INSERT INTO brands (name, sub_category_id) VALUES ($1, $2) RETURNING *`,
                    [trimmedName, subCatId]
                );
            }
        } else if (entity === 'categories') {
            const existing = await pool.query(
                'SELECT * FROM categories WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) LIMIT 1',
                [trimmedName]
            );
            if (existing.rows.length > 0) {
                result = existing;
            } else {
                result = await pool.query(
                    'INSERT INTO categories (name) VALUES ($1) RETURNING *',
                    [trimmedName]
                );
            }
        } else {
            result = await pool.query(
                `INSERT INTO ${entity} (name) VALUES ($1) RETURNING *`,
                [trimmedName]
            );
        }

        res.status(201).json({
            message: 'Successfully added!',
            data: entity === 'products' ? formatProductResponse(result.rows[0]) : result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            const entityLabels = {
                categories: 'Category',
                sub_categories: 'Sub-Category',
                brands: 'Brand',
                models: 'Model',
                series: 'Series',
                product_names: 'Product Name',
                products: 'Product'
            };
            const label = entityLabels[entity] || 'Item';
            return res.status(409).json({
                error: `A ${label.toLowerCase()} with this name already exists! Please use a different name.`
            });
        }
        console.error(`[masterCreateController error]:`, error);
        res.status(500).json({ error: error.message || 'Server error!' });
    }
};

module.exports = { create };
