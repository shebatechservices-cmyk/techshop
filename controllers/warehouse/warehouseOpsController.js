const pool = require('../../config/db');
const { ensureWarehousesTable } = require('./warehouseSchema');

/**
 * 5. PUT /api/warehouses/:id/default
 * Set specified warehouse as default
 */
exports.setDefaultWarehouse = async (req, res) => {
    const client = await pool.connect();
    try {
        await ensureWarehousesTable();
        const { id } = req.params;

        await client.query('BEGIN');
        const check = await client.query('SELECT id, name FROM warehouses WHERE id = $1 AND deleted_at IS NULL', [id]);
        if (check.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'Warehouse not found' });
        }

        await client.query('UPDATE warehouses SET is_default = false WHERE deleted_at IS NULL');
        const updated = await client.query(
            'UPDATE warehouses SET is_default = true, is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
            [id]
        );

        await client.query('COMMIT');

        return res.status(200).json({
            success: true,
            message: `"${updated.rows[0].name}" is now set as the default warehouse`,
            data: updated.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('setDefaultWarehouse error:', error);
        return res.status(500).json({ success: false, error: 'Failed to set default warehouse' });
    } finally {
        client.release();
    }
};

/**
 * 6. DELETE /api/warehouses/:id
 * Delete (soft-delete) warehouse, preventing deletion if it is default or has active stock
 */
exports.deleteWarehouse = async (req, res) => {
    try {
        await ensureWarehousesTable();
        const { id } = req.params;

        const warehouseRes = await pool.query('SELECT * FROM warehouses WHERE id = $1 AND deleted_at IS NULL', [id]);
        if (warehouseRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Warehouse not found' });
        }

        const warehouse = warehouseRes.rows[0];

        if (warehouse.is_default) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete the default warehouse. Please set another warehouse as default first.'
            });
        }

        // Check if there is active physical stock in stock_levels
        const stockCheck = await pool.query(`
            SELECT COALESCE(SUM(quantity), 0) AS total_qty
            FROM stock_levels
            WHERE warehouse_id = $1 AND quantity > 0
        `, [id]);

        const stockQty = Number(stockCheck.rows[0]?.total_qty || 0);
        if (stockQty > 0) {
            return res.status(400).json({
                success: false,
                error: `Cannot delete warehouse "${warehouse.name}". It currently holds ${stockQty} items in stock. Please transfer or clear stock first.`
            });
        }

        // Soft delete
        await pool.query(`
            UPDATE warehouses 
            SET deleted_at = CURRENT_TIMESTAMP, is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [id]);

        return res.status(200).json({
            success: true,
            message: `Warehouse "${warehouse.name}" was deleted successfully`
        });
    } catch (error) {
        console.error('deleteWarehouse error:', error);
        return res.status(500).json({ success: false, error: 'Failed to delete warehouse' });
    }
};
