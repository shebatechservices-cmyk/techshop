const pool = require('../config/db');

// Helper to sanitize money numbers
const money = (val) => Number.parseFloat(val || 0) || 0;

// 1. Get Inventory with Full Stock Valuation, Inflow, and Metrics
exports.getInventory = async (req, res) => {
    try {
        const { warehouse_id, filter, search, category_id } = req.query;

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
                COALESCE(p.purchase_price, 0) AS cost_price,
                COALESCE(p.selling_price, 0) AS sale_price,
                COALESCE(p.mrp, 0) AS mrp,
                COALESCE(p.stock, 0) AS stock,
                COALESCE(p.min_stock, 5) AS min_stock,
                COALESCE(p.warranty_months, 0) AS warranty_months,
                p.supplier_warranty_expire_date,
                p.status,
                p.image_url,
                COALESCE(p.is_ecommerce_active, true) AS is_ecommerce_active,
                COALESCE(p.purchase_count, 0) AS purchase_count,
                COALESCE((
                    SELECT SUM(poi.quantity) 
                    FROM purchase_order_items poi 
                    WHERE poi.product_id = p.id
                ), 0) AS total_inflow_units,
                COALESCE((
                    SELECT COUNT(*) 
                    FROM purchase_order_serials pos
                    JOIN purchase_order_items poi ON poi.id = pos.purchase_order_item_id
                    WHERE poi.product_id = p.id
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

        const result = await pool.query(query, params);
        let items = result.rows;

        // Build composite label for each product: [Brand] [Name] [Model] [Series]
        items = items.map((p) => {
            const parts = [p.brand_name, p.name, p.model_name, p.series_name]
                .filter(Boolean)
                .filter((val, idx, arr) => arr.indexOf(val) === idx);
            const compositeName = parts.length > 0 ? parts.join(' ') : p.name;

            const stock = Number(p.stock || 0);
            const minStock = Number(p.min_stock || 5);
            let stockStatus = 'in_stock';
            if (stock <= 0) {
                stockStatus = 'out_of_stock';
            } else if (stock <= minStock) {
                stockStatus = 'low_stock';
            }

            return {
                ...p,
                composite_name: compositeName,
                cost_price: Number(p.cost_price || 0),
                sale_price: Number(p.sale_price || 0),
                mrp: Number(p.mrp || 0),
                stock: stock,
                min_stock: minStock,
                stock_status: stockStatus,
                total_inflow_units: Number(p.total_inflow_units || 0),
            };
        });

        // Compute Overview Metrics across entire catalog
        const totalProducts = items.length;
        const totalUnits = items.reduce((sum, p) => sum + p.stock, 0);
        const totalCostValuation = items.reduce((sum, p) => sum + (p.stock * p.cost_price), 0);
        const totalRetailValuation = items.reduce((sum, p) => sum + (p.stock * p.sale_price), 0);
        const lowStockCount = items.filter((p) => p.stock_status === 'low_stock').length;
        const outOfStockCount = items.filter((p) => p.stock_status === 'out_of_stock').length;

        // In-memory filter if search or filter status is provided
        let filteredItems = items;
        if (search && search.trim()) {
            const q = search.trim().toLowerCase();
            filteredItems = filteredItems.filter((p) => {
                return (
                    p.composite_name.toLowerCase().includes(q) ||
                    (p.sku && p.sku.toLowerCase().includes(q)) ||
                    (p.barcode && p.barcode.toLowerCase().includes(q)) ||
                    (p.category_name && p.category_name.toLowerCase().includes(q)) ||
                    (p.sub_category_name && p.sub_category_name.toLowerCase().includes(q)) ||
                    (p.brand_name && p.brand_name.toLowerCase().includes(q)) ||
                    (p.model_name && p.model_name.toLowerCase().includes(q))
                );
            });
        }

        if (filter && filter !== 'all') {
            if (filter === 'in_stock') {
                filteredItems = filteredItems.filter((p) => p.stock > 0);
            } else if (filter === 'low_stock' || filter === 'low') {
                filteredItems = filteredItems.filter((p) => p.stock_status === 'low_stock');
            } else if (filter === 'out_of_stock' || filter === 'out') {
                filteredItems = filteredItems.filter((p) => p.stock_status === 'out_of_stock');
            }
        }

        return res.status(200).json({
            success: true,
            summary: {
                total_products: totalProducts,
                total_units: totalUnits,
                total_cost_valuation: totalCostValuation,
                total_retail_valuation: totalRetailValuation,
                low_stock_count: lowStockCount,
                out_of_stock_count: outOfStockCount,
            },
            data: filteredItems,
        });
    } catch (error) {
        console.error('getInventory error:', error);
        return res.status(500).json({ success: false, error: 'Failed to retrieve inventory data' });
    }
};

// 2. Get Warehouses list
exports.getWarehouses = async (_req, res) => {
    try {
        const result = await pool.query('SELECT * FROM warehouses ORDER BY is_default DESC, id ASC');
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('getWarehouses error:', error);
        return res.status(500).json({ success: false, error: 'Failed to retrieve warehouses' });
    }
};

// 3. Get Serial & Warranty details for a specific product
exports.getProductWarranty = async (req, res) => {
    try {
        const { id } = req.params;
        const productRes = await pool.query(`
            SELECT p.id, p.name, p.sku, p.barcode, p.warranty_months, p.supplier_warranty_expire_date,
                   b.name AS brand_name, m.name AS model_name, s.name AS series_name
            FROM products p
            LEFT JOIN brands b ON b.id = p.brand_id
            LEFT JOIN models m ON m.id = p.model_id
            LEFT JOIN series s ON s.id = p.series_id
            WHERE p.id = $1
        `, [id]);

        if (productRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        const product = productRes.rows[0];
        const compositeParts = [product.brand_name, product.name, product.model_name, product.series_name]
            .filter(Boolean)
            .filter((val, idx, arr) => arr.indexOf(val) === idx);
        product.composite_name = compositeParts.join(' ');

        // Query all serials ever purchased for this product
        const serialsRes = await pool.query(`
            SELECT 
                pos.id AS serial_id,
                pos.serial_code,
                COALESCE(poi.warranty_months, p.warranty_months, 0) AS warranty_months,
                poi.expected_date,
                poi.supplier_warranty_expire_date,
                poi.cost_price,
                poi.final_sale_price,
                po.po_number,
                po.created_at AS purchase_date,
                sup.name AS supplier_name,
                sup.phone AS supplier_phone,
                sis.id AS sold_serial_id,
                si.invoice_no AS sale_invoice_no,
                si.created_at AS sale_date,
                CASE 
                    WHEN sis.id IS NOT NULL THEN 'Sold'
                    ELSE 'In Stock'
                END AS status
            FROM purchase_order_serials pos
            JOIN purchase_order_items poi ON poi.id = pos.purchase_order_item_id
            JOIN purchase_orders po ON po.id = poi.purchase_order_id
            JOIN products p ON p.id = poi.product_id
            LEFT JOIN suppliers sup ON sup.id = po.supplier_id
            LEFT JOIN sales_item_serials sis ON sis.serial_code = pos.serial_code
            LEFT JOIN sales_items si_item ON si_item.id = sis.sales_item_id
            LEFT JOIN sales_invoices si ON si.id = si_item.sales_invoice_id
            WHERE poi.product_id = $1
            ORDER BY pos.id DESC
        `, [id]);

        return res.status(200).json({
            success: true,
            product,
            serials: serialsRes.rows,
        });
    } catch (error) {
        console.error('getProductWarranty error:', error);
        return res.status(500).json({ success: false, error: 'Failed to retrieve warranty details' });
    }
};

// 4. Toggle E-commerce Active Status for a Product
exports.toggleEcommerce = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_ecommerce_active } = req.body;

        let query = '';
        let params = [];

        if (typeof is_ecommerce_active === 'boolean') {
            query = `UPDATE products SET is_ecommerce_active = $1, updated_at = NOW() WHERE id = $2 RETURNING id, is_ecommerce_active`;
            params = [is_ecommerce_active, id];
        } else {
            query = `UPDATE products SET is_ecommerce_active = NOT COALESCE(is_ecommerce_active, true), updated_at = NOW() WHERE id = $1 RETURNING id, is_ecommerce_active`;
            params = [id];
        }

        const result = await pool.query(query, params);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        return res.status(200).json({
            success: true,
            data: result.rows[0],
            message: `Product e-commerce status updated to ${result.rows[0].is_ecommerce_active ? 'Active' : 'Inactive'}`
        });
    } catch (error) {
        console.error('toggleEcommerce error:', error);
        return res.status(500).json({ success: false, error: 'Failed to update e-commerce status' });
    }
};

// 5. Transfer Stock between Warehouses
exports.transferStock = async (req, res) => {
    const { product_id, source_warehouse_id, dest_warehouse_id, quantity, notes } = req.body;

    if (!product_id) return res.status(400).json({ success: false, error: 'Product is required' });
    if (!source_warehouse_id || !dest_warehouse_id) {
        return res.status(400).json({ success: false, error: 'Source and destination warehouses are required' });
    }
    if (source_warehouse_id === dest_warehouse_id) {
        return res.status(400).json({ success: false, error: 'Source and destination warehouses cannot be the same' });
    }
    const transferQty = parseInt(quantity, 10);
    if (!transferQty || transferQty <= 0) {
        return res.status(400).json({ success: false, error: 'Transfer quantity must be greater than 0' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check product and available stock
        const prod = await client.query('SELECT id, name, stock FROM products WHERE id = $1', [product_id]);
        if (prod.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        const currentStock = Number(prod.rows[0].stock || 0);
        if (currentStock < transferQty) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                error: `Insufficient stock in warehouse. Available: ${currentStock}, Requested: ${transferQty}`
            });
        }

        const transferNo = `TRF-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

        const transfer = await client.query(`
            INSERT INTO stock_transfers (
                transfer_no, source_warehouse_id, dest_warehouse_id, product_id, quantity, notes
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [transferNo, source_warehouse_id, dest_warehouse_id, product_id, transferQty, notes || null]);

        await client.query('COMMIT');

        return res.status(201).json({
            success: true,
            data: transfer.rows[0],
            message: `Successfully transferred ${transferQty} units of "${prod.rows[0].name}"`
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('transferStock error:', error);
        return res.status(500).json({ success: false, error: 'Failed to execute stock transfer' });
    } finally {
        client.release();
    }
};

// 6. Force Clean Inventory Stock (Super Admin / Developer Action)
exports.cleanStockForce = async (req, res) => {
    const client = await pool.connect();
    try {
        const { mode = 'zero_stock', reason = 'Manual Force Inventory Stock Clean' } = req.body;
        await client.query('BEGIN');

        let updatedProductsCount = 0;
        let wipedProductsCount = 0;

        if (mode === 'wipe_all') {
            await client.query('DELETE FROM stock_transfers');
            await client.query('DELETE FROM stock_levels');
            await client.query('DELETE FROM product_images');

            const wiped = await client.query(`
                DELETE FROM products 
                WHERE id NOT IN (SELECT product_id FROM sales_items)
                  AND id NOT IN (SELECT product_id FROM purchase_order_items)
                RETURNING id
            `);
            wipedProductsCount = wiped.rowCount;

            const zeroed = await client.query(`
                UPDATE products 
                SET stock = 0, updated_at = NOW() 
                WHERE stock != 0
                RETURNING id
            `);
            updatedProductsCount = zeroed.rowCount;

            await client.query("DELETE FROM trash_records WHERE table_name = 'products'");
        } else {
            const resUpdated = await client.query(`
                UPDATE products 
                SET stock = 0, updated_at = NOW() 
                WHERE stock != 0
                RETURNING id
            `);
            updatedProductsCount = resUpdated.rowCount;
            await client.query('DELETE FROM stock_transfers');
            await client.query('DELETE FROM stock_levels');
        }

        // Audit Log
        await client.query(`
            INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data, severity)
            VALUES (1, 'FORCE_CLEAN_INVENTORY_STOCK', 'products', 0, NULL, $1, 'CRITICAL')
        `, [JSON.stringify({ mode, reason, updatedProductsCount, wipedProductsCount })]).catch(() => {});

        await client.query('COMMIT');

        return res.status(200).json({
            success: true,
            message: mode === 'wipe_all'
                ? `Inventory stock force cleaned! (${wipedProductsCount} products wiped, ${updatedProductsCount} stocks zeroed)`
                : `Inventory stock force cleaned! All warehouse stocks reset to 0 (${updatedProductsCount} products updated).`,
            mode,
            updatedCount: updatedProductsCount,
            wipedCount: wipedProductsCount
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('cleanStockForce error:', error);
        return res.status(500).json({ success: false, error: 'Failed to force clean inventory stock: ' + error.message });
    } finally {
        client.release();
    }
};

