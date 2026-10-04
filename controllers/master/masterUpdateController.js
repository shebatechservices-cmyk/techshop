const pool = require("../../config/db");
const { allowedEntities, ensureMasterSchema, parseBool, formatProductResponse } = require("./masterHelpers");

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

            const intCols = new Set(['category_id', 'sub_category_id', 'brand_id', 'model_id', 'series_id', 'stock', 'min_stock', 'warranty_months']);
            const numCols = new Set(['purchase_price', 'selling_price', 'mrp', 'conversion_rate', 'sub_unit_selling_price']);
            const boolCols = new Set(['is_featured', 'is_serial_tracked', 'is_serial_required', 'is_warranty_required', 'is_bundle', 'is_ecommerce_active']);

            Object.entries(cleanPayload).forEach(([key, value]) => {
                if (!validProductColumns.includes(key)) return;
                let sanitizedValue = value;
                if (intCols.has(key)) {
                    if (value === '' || value === null || value === undefined || value === 'null') {
                        sanitizedValue = (key === 'stock' || key === 'min_stock' || key === 'warranty_months') ? 0 : null;
                    } else {
                        const parsed = parseInt(value, 10);
                        sanitizedValue = isNaN(parsed) ? null : parsed;
                    }
                } else if (numCols.has(key)) {
                    if (value === '' || value === null || value === undefined || value === 'null') {
                        sanitizedValue = (key === 'conversion_rate') ? 1 : (key.includes('price') || key === 'mrp' ? 0 : null);
                    } else {
                        const parsed = Number(value);
                        sanitizedValue = isNaN(parsed) ? null : parsed;
                    }
                } else if (boolCols.has(key)) {
                    sanitizedValue = Boolean(parseBool(value));
                } else {
                    if (value === '' || value === 'null') {
                        sanitizedValue = null;
                    }
                }
                columns.push(`${key} = $${index}`);
                values.push(sanitizedValue);
                index += 1;
            });
        } else {
            Object.entries(payload).forEach(([key, value]) => {
                if (key === 'id') return;
                let sanitizedValue = value;
                if (key.endsWith('_id')) {
                    if (value === '' || value === null || value === undefined || value === 'null') {
                        sanitizedValue = null;
                    } else {
                        const parsed = parseInt(value, 10);
                        sanitizedValue = isNaN(parsed) ? null : parsed;
                    }
                } else if (value === '' || value === 'null') {
                    sanitizedValue = null;
                }
                columns.push(`${key} = $${index}`);
                values.push(sanitizedValue);
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
            const rawBundleItems = payload.bundle_items !== undefined ? payload.bundle_items : payload.bundleItems;
            if (rawBundleItems !== undefined) {
                let parsed = [];
                try {
                    parsed = typeof rawBundleItems === 'string' ? (rawBundleItems.trim() ? JSON.parse(rawBundleItems) : []) : (Array.isArray(rawBundleItems) ? rawBundleItems : []);
                } catch {
                    parsed = [];
                }
                await pool.query('DELETE FROM product_bundle_items WHERE bundle_id = $1', [Number(id)]);
                for (const bi of parsed) {
                    if (bi && bi.product_id) {
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
        console.error(`[masterUpdateController error]:`, error);
        res.status(500).json({ error: error.message || 'Server error!' });
    }
};

module.exports = { update };
