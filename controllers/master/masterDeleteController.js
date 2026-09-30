const pool = require("../../config/db");
const { allowedEntities, ensureMasterSchema, hasActive, moveRecordToTrash } = require("./masterHelpers");

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

module.exports = { remove };
