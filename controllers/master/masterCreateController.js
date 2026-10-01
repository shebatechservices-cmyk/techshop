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

        const trimmedName = String(name || '').trim();
        if (entity !== 'products' && !trimmedName) {
            return res.status(400).json({ error: 'Name is required' });
        }

        await ensureMasterSchema();
        let result;

        if (entity === 'sub_categories') {
            if (!category_id) {
                return res.status(400).json({ error: 'Please select a category' });
            }
            result = await pool.query(
                'INSERT INTO sub_categories (name, category_id) VALUES ($1, $2) RETURNING *',
                [trimmedName, category_id]
            );
        } else if (entity === 'series') {
            const existing = await pool.query(
                'SELECT * FROM series WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) AND brand_id = $2 LIMIT 1',
                [trimmedName, brand_id]
            );
            if (existing.rows.length > 0) {
                result = existing;
            } else {
                result = await pool.query(
                    `INSERT INTO series (name, brand_id, model_id)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (name, brand_id) DO UPDATE SET model_id = COALESCE(series.model_id, EXCLUDED.model_id)
                     RETURNING *`,
                    [trimmedName, brand_id, model_id || null]
                );
            }
        } else if (entity === 'models') {
            result = await pool.query(
                'INSERT INTO models (name, brand_id, category_id, sub_category_id) VALUES ($1, $2, $3, $4) RETURNING *',
                [trimmedName, brand_id, category_id, sub_category_id]
            );
        } else if (entity === 'products') {
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
                    sku ? String(sku).trim() : null,
                    barcode ? String(barcode).trim() : null,
                    name ? String(name).trim() : '',
                    category_id ? Number(category_id) : null,
                    sub_category_id ? Number(sub_category_id) : null,
                    brand_id ? Number(brand_id) : null,
                    model_id ? Number(model_id) : null,
                    series_id ? Number(series_id) : null,
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
                (Number(warranty_months || req.body.warranty_months || 0) > 0)
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
                    name,
                    category_id,
                    sub_category_id,
                    brand_id,
                    model_id,
                    series_id,
                    sku || null,
                    barcode || null,
                    short_name || null,
                    description || null,
                    purchase_price || 0,
                    selling_price || 0,
                    mrp || 0,
                    stock || 0,
                    min_stock || 0,
                    location || null,
                    warranty_months || 0,
                    status || 'active',
                    image_url || null,
                    is_featured || false,
                    supplier_name || null,
                    supplier_phone || null,
                    isSerialReq,
                    isSerialReq,
                    isWarrantyReq,
                    isBundleVal,
                    req.body.unit_name || 'Pcs',
                    req.body.sub_unit_name || null,
                    req.body.conversion_rate ? Number(req.body.conversion_rate) : 1,
                    req.body.sub_unit_selling_price ? Number(req.body.sub_unit_selling_price) : null,
                    req.body.sub_unit_barcode ? String(req.body.sub_unit_barcode).trim() : null,
                ]
            );

            const createdProd = result.rows[0];
            const rawBundleItems = req.body.bundle_items || req.body.bundleItems;
            if (isBundleVal && rawBundleItems) {
                const parsed = typeof rawBundleItems === 'string' ? JSON.parse(rawBundleItems) : (Array.isArray(rawBundleItems) ? rawBundleItems : []);
                for (const bi of parsed) {
                    if (bi.product_id) {
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
            result = await pool.query(
                `INSERT INTO product_names (name, brand_id, category_id, sub_category_id)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT DO NOTHING
                 RETURNING *`,
                [trimmedName, brand_id || null, category_id || null, sub_category_id || null]
            );
            if (!result.rows.length) {
                result = await pool.query(
                    'SELECT * FROM product_names WHERE name = $1 LIMIT 1',
                    [trimmedName]
                );
            }
        } else if (entity === 'brands') {
            result = await pool.query(
                `INSERT INTO ${entity} (name, sub_category_id) VALUES ($1, $2) RETURNING *`,
                [trimmedName, sub_category_id || null]
            );
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
        console.error(error);
        res.status(500).json({ error: 'Server error!' });
    }
};

module.exports = { create };
