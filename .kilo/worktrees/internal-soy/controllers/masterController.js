const pool = require('../config/db');

// Allowed table entities for security
const allowedEntities = ['categories', 'sub_categories', 'brands', 'models', 'series', 'products', 'product_names'];

let masterSchemaReady = false;
async function ensureMasterSchema() {
    if (masterSchemaReady) return;
    const tables = ['categories', 'sub_categories', 'brands', 'models', 'series', 'product_names', 'products'];
    for (const table of tables) {
        await pool.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP`);
        await pool.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS deleted_by INTEGER`);
    }
    await pool.query('ALTER TABLE series ADD COLUMN IF NOT EXISTS model_id INTEGER').catch(() => null);
    await pool.query('ALTER TABLE brands ADD COLUMN IF NOT EXISTS sub_category_id INTEGER').catch(() => null);
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
            filters.push(`category_id = $${index}`);
            params.push(categoryId);
            index += 1;
        }
        if (subCategoryId !== null) {
            filters.push(`sub_category_id = $${index}`);
            params.push(subCategoryId);
            index += 1;
        }
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
        if (seriesId !== null) {
            filters.push(`series_id = $${index}`);
            params.push(seriesId);
            index += 1;
        }
        if (query.status && query.status !== 'undefined' && query.status !== 'null') {
            filters.push(`status = $${index}`);
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
            ? `SELECT p.*, c.name AS category_name, sc.name AS sub_category_name,
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
                      ), 'percent') AS last_margin_type
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

            result = await pool.query(
                `INSERT INTO products (
                    name, category_id, sub_category_id, brand_id, model_id, series_id,
                    sku, barcode, short_name, description,
                    purchase_price, selling_price, mrp, stock, min_stock,
                    location, warranty_months, status, image_url, is_featured,
                    supplier_name, supplier_phone
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
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
                ]
            );
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
            data: result.rows[0]
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
            'supplier_name', 'supplier_phone'
        ];

        const columns = [];
        const values = [];
        let index = 1;

        Object.entries(payload).forEach(([key, value]) => {
            if (key === 'id') return;
            if (entity === 'products' && !validProductColumns.includes(key)) return;
            columns.push(`${key} = $${index}`);
            values.push(value);
            index += 1;
        });

        if (columns.length === 0) {
            return res.status(400).json({ error: 'No valid columns to update' });
        }

        values.push(id);
        const result = await pool.query(
            `UPDATE ${entity} SET ${columns.join(', ')} WHERE id = $${index} RETURNING *`,
            values
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });

        res.status(200).json({ message: 'Successfully updated!', data: result.rows[0] });
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