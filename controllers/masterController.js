const pool = require('../config/db');

// Allowed table entities for security
const allowedEntities = ['categories', 'sub_categories', 'brands', 'models', 'series', 'products', 'product_names'];

let masterSchemaReady = false;
async function ensureMasterSchema() {
    if (masterSchemaReady) return;
    const tables = ['categories', 'sub_categories', 'brands', 'models', 'series', 'product_names', 'products'];
    for (const table of tables) {
        await pool.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP`).catch(() => null);
        await pool.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS deleted_by INTEGER`).catch(() => null);
    }
    await pool.query('ALTER TABLE series ADD COLUMN IF NOT EXISTS model_id INTEGER').catch(() => null);
    await pool.query('ALTER TABLE brands ADD COLUMN IF NOT EXISTS sub_category_id INTEGER').catch(() => null);
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS is_serial_tracked BOOLEAN DEFAULT FALSE').catch(() => null);
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS is_serial_required BOOLEAN DEFAULT FALSE').catch(() => null);
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS is_warranty_required BOOLEAN DEFAULT FALSE').catch(() => null);
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS warranty_months INTEGER DEFAULT 0').catch(() => null);
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_warranty_expire_date DATE').catch(() => null);
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS is_bundle BOOLEAN DEFAULT FALSE').catch(() => null);
    await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_name VARCHAR(50) DEFAULT 'Pcs'").catch(() => null);
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS sub_unit_name VARCHAR(50)').catch(() => null);
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS conversion_rate NUMERIC(10,2) DEFAULT 1').catch(() => null);
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS sub_unit_selling_price NUMERIC(12,2)').catch(() => null);
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS sub_unit_barcode VARCHAR(100)').catch(() => null);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS product_bundle_items (
            id SERIAL PRIMARY KEY,
            bundle_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            quantity INT NOT NULL DEFAULT 1,
            unit_price NUMERIC(12,2) DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    `).catch(() => null);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS trash_records (
            id SERIAL PRIMARY KEY,
            table_name VARCHAR(50) NOT NULL,
            record_id INT NOT NULL,
            record_data JSONB NOT NULL,
            deleted_by INT,
            deleted_at TIMESTAMP DEFAULT NOW(),
            record_title VARCHAR(255)
        )
    `).catch(() => null);
    masterSchemaReady = true;
}

const parseBool = (val) => {
    if (val === undefined || val === null) return undefined;
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') {
        const s = val.trim().toLowerCase();
        if (s === 'true' || s === '1') return true;
        if (s === 'false' || s === '0') return false;
    }
    if (typeof val === 'number') return val === 1;
    return Boolean(val);
};

const formatProductResponse = (row) => {
    if (!row) return row;
    const isSerial = Boolean(
        parseBool(row.is_serial_required) ||
        parseBool(row.is_serial_tracked) ||
        parseBool(row.tracks_serial) ||
        parseBool(row.isSerialRequired)
    );
    const isWarranty = Boolean(
        parseBool(row.is_warranty_required) ||
        parseBool(row.isWarrantyRequired) ||
        (Number(row.warranty_months || 0) > 0)
    );
    const isBundle = Boolean(parseBool(row.is_bundle));
    const costPrice = Number(row.cost_price || row.costPrice || row.last_purchase_price || row.purchase_price || 0);
    const salePrice = Number(row.sale_price || row.salePrice || row.batch_sale_price || row.selling_price || row.mrp || costPrice);
    return {
        ...row,
        cost_price: costPrice,
        costPrice: costPrice,
        sale_price: salePrice,
        salePrice: salePrice,
        selling_price: salePrice,
        purchase_price: costPrice,
        isSerialRequired: isSerial,
        is_serial_required: isSerial,
        is_serial_tracked: isSerial,
        tracks_serial: isSerial,
        isWarrantyRequired: isWarranty,
        is_warranty_required: isWarranty,
        is_bundle: isBundle,
        unit_name: row.unit_name || 'Pcs',
        sub_unit_name: row.sub_unit_name || null,
        conversion_rate: Number(row.conversion_rate || 1),
        sub_unit_selling_price: row.sub_unit_selling_price !== null && row.sub_unit_selling_price !== undefined ? Number(row.sub_unit_selling_price) : null,
        sub_unit_barcode: row.sub_unit_barcode || null,
        bundle_items: Array.isArray(row.bundle_items) ? row.bundle_items : [],
    };
};

async function hasActive(sql, params) {
    const result = await pool.query(sql, params).catch(() => ({ rows: [] }));
    return result.rows.length > 0;
}

async function moveRecordToTrash(entity, id, item) {
    const itemName = item.name || `${entity} #${id}`;
    await pool.query(
        `UPDATE ${entity} SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`,
        [id]
    );
    try {
        await pool.query(
            `INSERT INTO trash_records (table_name, record_id, record_title, record_data, deleted_at)
             VALUES ($1, $2, $3, $4::jsonb, NOW())`,
            [entity, id, String(itemName).slice(0, 255), JSON.stringify(item)]
        );
    } catch (trashErr) {
        console.error(`trash_records insert failed for ${entity} #${id}:`, trashErr.message);
    }
    return itemName;
}

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

    if (entity === 'product_names' && brandId !== null) {
        filters.push(`(brand_id = $${index} OR brand_id IS NULL)`);
        params.push(brandId);
        index += 1;
    }

    if (entity === 'product_names' && subCategoryId !== null) {
        filters.push(`(sub_category_id = $${index} OR sub_category_id IS NULL)`);
        params.push(subCategoryId);
        index += 1;
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
        filters.push(`(sub_category_id = $${index} OR sub_category_id IS NULL)`);
        params.push(subCategoryId);
        index += 1;
    }

    if (entity === 'series') {
        if (brandId !== null) {
            filters.push(`brand_id = $${index}`);
            params.push(brandId);
            index += 1;
        }
        if (modelId !== null) {
            filters.push(`(model_id = $${index} OR model_id IS NULL)`);
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

        query += entity === 'products' ? ' ORDER BY p.id ASC' : ' ORDER BY id ASC';
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
            const rows = result.rows.map((row) => {
                const p = formatProductResponse(row);
                p.bundle_items = bundleMap[row.id] || [];
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
        console.error(error);
        res.status(500).json({ error: 'Server error!' });
    }
};

// ২. তাৎক্ষণিক যুক্ত করা (+ বাটন) (POST)
// 2. Create entity (+ button) (POST)
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
            result = await pool.query(
                'INSERT INTO series (name, brand_id, model_id) VALUES ($1, $2, $3) RETURNING *',
                [trimmedName, brand_id, model_id || null]
            );
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

// 3. Edit or update entity (PUT)
const update = async (req, res) => {
    const { entity, id } = req.params;
    if (!allowedEntities.includes(entity)) return res.status(400).json({ error: 'Invalid entity' });

    try {
        const payload = req.body;
        if (!payload || Object.keys(payload).length === 0) {
            return res.status(400).json({ error: 'No update data provided' });
        }

        if (entity === 'product_names' && payload.name) {
            const oldRow = await pool.query(`SELECT name FROM product_names WHERE id = $1`, [id]);
            const oldName = oldRow.rows[0]?.name;
            const newName = String(payload.name).trim();
            const result = await pool.query(
                `UPDATE product_names SET name = $1 WHERE id = $2 RETURNING *`,
                [newName, id]
            );
            if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
            if (oldName && oldName !== newName) {
                await pool.query(`UPDATE products SET name = $1 WHERE name = $2`, [newName, oldName]).catch(() => {});
            }
            return res.status(200).json({ message: 'Successfully updated!', data: result.rows[0] });
        }

        const validProductColumns = [
            'name', 'short_name', 'sku', 'barcode', 'description',
            'category_id', 'sub_category_id', 'brand_id', 'model_id', 'series_id',
            'purchase_price', 'selling_price', 'mrp', 'stock', 'min_stock',
            'location', 'warranty_months', 'status', 'image_url', 'is_featured',
            'supplier_name', 'supplier_phone',
            'is_serial_tracked', 'is_serial_required', 'is_warranty_required',
            'is_bundle', 'unit_name', 'sub_unit_name', 'conversion_rate', 'sub_unit_selling_price', 'sub_unit_barcode'
        ];

        const columns = [];
        const values = [];
        let index = 1;

        if (entity === 'products') {
            const isSerialReq = parseBool(
                payload.is_serial_required !== undefined ? payload.is_serial_required :
                (payload.isSerialRequired !== undefined ? payload.isSerialRequired :
                (payload.is_serial_tracked !== undefined ? payload.is_serial_tracked :
                (payload.tracks_serial !== undefined ? payload.tracks_serial : undefined)))
            );

            const isWarrantyReq = parseBool(
                payload.is_warranty_required !== undefined ? payload.is_warranty_required :
                (payload.isWarrantyRequired !== undefined ? payload.isWarrantyRequired :
                (payload.warranty_months !== undefined ? (Number(payload.warranty_months || 0) > 0) : undefined))
            );

            const isBundleVal = parseBool(
                payload.is_bundle !== undefined ? payload.is_bundle :
                (payload.isBundle !== undefined ? payload.isBundle : undefined)
            );

            const cleanPayload = { ...payload };
            delete cleanPayload.id;
            delete cleanPayload.tracks_serial;
            delete cleanPayload.isSerialRequired;
            delete cleanPayload.isWarrantyRequired;

            if (isSerialReq !== undefined) {
                cleanPayload.is_serial_tracked = isSerialReq;
                cleanPayload.is_serial_required = isSerialReq;
            }
            if (isWarrantyReq !== undefined) {
                cleanPayload.is_warranty_required = isWarrantyReq;
            }
            if (isBundleVal !== undefined) {
                cleanPayload.is_bundle = isBundleVal;
            }

            Object.entries(cleanPayload).forEach(([key, value]) => {
                if (!validProductColumns.includes(key)) return;
                columns.push(`${key} = $${index}`);
                values.push(value);
                index += 1;
            });
        } else {
            Object.entries(payload).forEach(([key, value]) => {
                if (key === 'id') return;
                columns.push(`${key} = $${index}`);
                values.push(value);
                index += 1;
            });
        }

        if (columns.length === 0) {
            return res.status(400).json({ error: 'No valid columns to update' });
        }

        values.push(id);
        const result = await pool.query(
            `UPDATE ${entity} SET ${columns.join(', ')} WHERE id = $${index} RETURNING *`,
            values
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });

        const updatedRow = result.rows[0];
        if (entity === 'products') {
            const rawBundleItems = payload.bundle_items || payload.bundleItems;
            if (rawBundleItems !== undefined) {
                const parsed = typeof rawBundleItems === 'string' ? JSON.parse(rawBundleItems) : (Array.isArray(rawBundleItems) ? rawBundleItems : []);
                await pool.query('DELETE FROM product_bundle_items WHERE bundle_id = $1', [Number(id)]);
                for (const bi of parsed) {
                    if (bi.product_id) {
                        await pool.query(
                            `INSERT INTO product_bundle_items (bundle_id, product_id, quantity, unit_price)
                             VALUES ($1, $2, $3, $4)`,
                            [Number(id), Number(bi.product_id), Number(bi.quantity || 1), Number(bi.unit_price || 0)]
                        );
                    }
                }
                updatedRow.bundle_items = parsed;
            }
        }

        res.status(200).json({
            message: 'Successfully updated!',
            data: entity === 'products' ? formatProductResponse(updatedRow) : updatedRow
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
                error: `A ${label.toLowerCase()} with this name already exists!`
            });
        }
        console.error(error);
        res.status(500).json({ error: 'Server error!' });
    }
};

// 4. Delete entity conditionally (DELETE)
const remove = async (req, res) => {
    const { entity, id } = req.params;
    if (!allowedEntities.includes(entity)) return res.status(400).json({ error: 'Invalid entity' });

    try {
        await ensureMasterSchema();
        const itemRes = await pool.query(`SELECT * FROM ${entity} WHERE id = $1`, [id]);
        if (!itemRes.rows.length) {
            return res.status(404).json({ error: 'Item not found' });
        }
        const item = itemRes.rows[0];
        if (item.deleted_at) {
            return res.status(400).json({ error: 'Item is already in Trash' });
        }

        const itemName = item.name || `${entity} #${id}`;

        if (entity === 'products') {
            const isForce = req.query.force === 'true';

            // Stock Check
            if (Number(item.stock || 0) > 0 && !isForce) {
                return res.status(400).json({
                    error: `Cannot delete product "${itemName}" because it has current warehouse stock (${item.stock}). Please adjust or clear stock first.`
                });
            }

            // Lock chain check 1: Active Purchase orders
            const purchaseCheck = await pool.query(
                `SELECT 1 FROM purchase_order_items poi
                 JOIN purchase_orders po ON poi.purchase_order_id = po.id
                 WHERE poi.product_id = $1 AND po.deleted_at IS NULL LIMIT 1`,
                [id]
            ).catch(() => ({ rows: [] }));

            if (purchaseCheck.rows.length > 0 && !isForce) {
                return res.status(400).json({
                    error: `Cannot delete product "${itemName}" because it has active recorded purchases. You can set its status to Inactive instead.`
                });
            }

            // Lock chain check 2: Active Sales invoices
            const salesCheck = await pool.query(
                `SELECT 1 FROM sales_items si
                 JOIN sales s ON si.sale_id = s.id
                 WHERE si.product_id = $1 AND s.deleted_at IS NULL LIMIT 1`,
                [id]
            ).catch(() => ({ rows: [] }));

            if (salesCheck.rows.length > 0 && !isForce) {
                return res.status(400).json({
                    error: `Cannot delete product "${itemName}" because it has active recorded sales invoices. You can set its status to Inactive instead.`
                });
            }

            // Lock chain check 3: Active Warranty claims
            const warrantyCheck = await pool.query(
                `SELECT 1 FROM warranty_claims WHERE product_id = $1 AND deleted_at IS NULL LIMIT 1`,
                [id]
            ).catch(() => ({ rows: [] }));

            if (warrantyCheck.rows.length > 0 && !isForce) {
                return res.status(400).json({
                    error: `Cannot delete product "${itemName}" because active warranty claims are attached to it.`
                });
            }

            // Lock chain check 4: Active Product returns
            const returnCheck = await pool.query(
                `SELECT 1 FROM product_returns WHERE product_id = $1 AND deleted_at IS NULL LIMIT 1`,
                [id]
            ).catch(() => ({ rows: [] }));

            if (returnCheck.rows.length > 0 && !isForce) {
                return res.status(400).json({
                    error: `Cannot delete product "${itemName}" because customer returns are attached to it.`
                });
            }

            await pool.query('UPDATE products SET deleted_at = NOW() WHERE id = $1', [id]);
            await pool.query(`
                INSERT INTO trash_records (table_name, record_id, record_title, record_data, deleted_at)
                VALUES ('products', $1, $2, $3, NOW())
            `, [id, itemName, JSON.stringify(item)]).catch(() => null);

            return res.status(200).json({ message: `Product "${itemName}" moved to Trash successfully!` });
        }

        // Cascading Leaf-First Deletion Rules (Bottom-up enforcement)
        if (entity === 'series') {
            const usedInProducts = await pool.query(
                `SELECT 1 FROM products WHERE series_id = $1 AND deleted_at IS NULL LIMIT 1`,
                [id]
            );
            if (usedInProducts.rows.length > 0) {
                return res.status(400).json({
                    error: `Cannot delete series "${itemName}". Active products in the catalog are currently using this series. Products must be deleted first.`
                });
            }
        }

        if (entity === 'models') {
            const usedInSeries = await pool.query(
                `SELECT 1 FROM series WHERE model_id = $1 AND deleted_at IS NULL LIMIT 1`,
                [id]
            ).catch(() => ({ rows: [] }));
            if (usedInSeries.rows.length > 0) {
                return res.status(400).json({
                    error: `Cannot delete model "${itemName}". Active series are attached to this model. Please delete series first.`
                });
            }

            const usedInProducts = await pool.query(
                `SELECT 1 FROM products WHERE model_id = $1 AND deleted_at IS NULL LIMIT 1`,
                [id]
            );
            if (usedInProducts.rows.length > 0) {
                return res.status(400).json({
                    error: `Cannot delete model "${itemName}". Active products in the catalog are currently using this model. Please delete from the end (Products) upwards.`
                });
            }
        }

        if (entity === 'product_names') {
            const usedInProducts = await pool.query(
                `SELECT 1 FROM products WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) AND deleted_at IS NULL LIMIT 1`,
                [item.name]
            );
            if (usedInProducts.rows.length > 0) {
                return res.status(400).json({
                    error: `Cannot delete product name "${itemName}". Active products in the catalog are currently using this name. Please delete products first.`
                });
            }
        }

        if (entity === 'brands') {
            const usedInSeries = await pool.query(
                `SELECT 1 FROM series WHERE brand_id = $1 AND deleted_at IS NULL LIMIT 1`,
                [id]
            );
            if (usedInSeries.rows.length > 0) {
                return res.status(400).json({
                    error: `Cannot delete brand "${itemName}". Active series are attached to this brand. Please delete series first.`
                });
            }

            const usedInModels = await pool.query(
                `SELECT 1 FROM models WHERE brand_id = $1 AND deleted_at IS NULL LIMIT 1`,
                [id]
            );
            if (usedInModels.rows.length > 0) {
                return res.status(400).json({
                    error: `Cannot delete brand "${itemName}". Active models are attached to this brand. Please delete models first.`
                });
            }

            const usedInProductNames = await pool.query(
                `SELECT 1 FROM product_names WHERE brand_id = $1 AND deleted_at IS NULL LIMIT 1`,
                [id]
            ).catch(() => ({ rows: [] }));
            if (usedInProductNames.rows.length > 0) {
                return res.status(400).json({
                    error: `Cannot delete brand "${itemName}". Active product names are attached to this brand. Please delete product names first.`
                });
            }

            const usedInProducts = await pool.query(
                `SELECT 1 FROM products WHERE brand_id = $1 AND deleted_at IS NULL LIMIT 1`,
                [id]
            );
            if (usedInProducts.rows.length > 0) {
                return res.status(400).json({
                    error: `Cannot delete brand "${itemName}". Active products in the catalog are using this brand. Please delete products first.`
                });
            }
        }

        if (entity === 'sub_categories') {
            const usedInBrands = await pool.query(
                `SELECT 1 FROM brands WHERE sub_category_id = $1 AND deleted_at IS NULL LIMIT 1`,
                [id]
            ).catch(() => ({ rows: [] }));
            if (usedInBrands.rows.length > 0) {
                return res.status(400).json({
                    error: `Cannot delete sub-category "${itemName}". Active brands are attached to it. Please delete brands first.`
                });
            }

            const usedInModels = await pool.query(
                `SELECT 1 FROM models WHERE sub_category_id = $1 AND deleted_at IS NULL LIMIT 1`,
                [id]
            ).catch(() => ({ rows: [] }));
            if (usedInModels.rows.length > 0) {
                return res.status(400).json({
                    error: `Cannot delete sub-category "${itemName}". Active models are attached to it. Please delete models first.`
                });
            }

            const usedInProductNames = await pool.query(
                `SELECT 1 FROM product_names WHERE sub_category_id = $1 AND deleted_at IS NULL LIMIT 1`,
                [id]
            ).catch(() => ({ rows: [] }));
            if (usedInProductNames.rows.length > 0) {
                return res.status(400).json({
                    error: `Cannot delete sub-category "${itemName}". Active product names are attached to it. Please delete product names first.`
                });
            }

            const usedInProducts = await pool.query(
                `SELECT 1 FROM products WHERE sub_category_id = $1 AND deleted_at IS NULL LIMIT 1`,
                [id]
            );
            if (usedInProducts.rows.length > 0) {
                return res.status(400).json({
                    error: `Cannot delete sub-category "${itemName}". Active products in the catalog are currently using it. Please delete products first.`
                });
            }
        }

        if (entity === 'categories') {
            const usedInSubs = await pool.query(
                `SELECT 1 FROM sub_categories WHERE category_id = $1 AND deleted_at IS NULL LIMIT 1`,
                [id]
            );
            if (usedInSubs.rows.length > 0) {
                return res.status(400).json({
                    error: `Cannot delete category "${itemName}". Active sub-categories are attached to it. Cascading hierarchy requires deleting from the bottom (Series / Models / Sub-categories) upwards.`
                });
            }

            const usedInModels = await pool.query(
                `SELECT 1 FROM models WHERE category_id = $1 AND deleted_at IS NULL LIMIT 1`,
                [id]
            ).catch(() => ({ rows: [] }));
            if (usedInModels.rows.length > 0) {
                return res.status(400).json({
                    error: `Cannot delete category "${itemName}". Active models are attached to it. Please delete models first.`
                });
            }

            const usedInProductNames = await pool.query(
                `SELECT 1 FROM product_names WHERE category_id = $1 AND deleted_at IS NULL LIMIT 1`,
                [id]
            ).catch(() => ({ rows: [] }));
            if (usedInProductNames.rows.length > 0) {
                return res.status(400).json({
                    error: `Cannot delete category "${itemName}". Active product names are attached to it. Please delete product names first.`
                });
            }

            const usedInProducts = await pool.query(
                `SELECT 1 FROM products WHERE category_id = $1 AND deleted_at IS NULL LIMIT 1`,
                [id]
            );
            if (usedInProducts.rows.length > 0) {
                return res.status(400).json({
                    error: `Cannot delete category "${itemName}". Active products in the catalog are currently using it. Please delete products first.`
                });
            }
        }

        // Perform Soft Delete
        await pool.query(`UPDATE ${entity} SET deleted_at = NOW() WHERE id = $1`, [id]);
        
        // Record accurately in trash_records
        await pool.query(`
            INSERT INTO trash_records (table_name, record_id, record_title, record_data, deleted_at)
            VALUES ($1, $2, $3, $4, NOW())
        `, [entity, id, itemName, JSON.stringify(item)]).catch(() => null);

        return res.status(200).json({ message: `"${itemName}" moved to Trash successfully!` });
    } catch (error) {
        if (error.code === '23503') {
            return res.status(400).json({
                error: 'Cannot delete this item because it is referenced by other active records. Cascading deletion requires deleting child records first.'
            });
        }
        console.error(error);
        res.status(500).json({ error: 'Server error!' });
    }
};

module.exports = { getAll, create, update, remove };