const pool = require('../../config/db');

// 1. Toggle E-commerce Active Status for a Product
const toggleEcommerce = async (req, res) => {
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

// 2. Force Clean Inventory Stock (Super Admin / Developer Action)
const cleanStockForce = async (req, res) => {
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

module.exports = {
    toggleEcommerce,
    cleanStockForce,
};
