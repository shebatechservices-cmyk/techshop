const pool = require('../../config/db');
const { ensureWarehousesTable } = require('./warehouseSchema');

/**
 * 1. GET /api/warehouses
 * Fetch all warehouses with active filter and stock count summary
 */
exports.getWarehouses = async (req, res) => {
    try {
        await ensureWarehousesTable();
        const { active } = req.query;
        const activeFilter = active === 'true' ? true : active === 'false' ? false : null;

        const query = `
            SELECT 
                w.id,
                w.name,
                w.code,
                w.location,
                w.address,
                w.contact_person,
                w.phone,
                w.is_default,
                w.is_active,
                w.created_at,
                w.updated_at,
                COALESCE(
                    (SELECT COUNT(DISTINCT sl.product_id) 
                     FROM stock_levels sl 
                     WHERE sl.warehouse_id = w.id AND sl.quantity > 0), 0
                ) AS in_stock_skus,
                COALESCE(
                    (SELECT SUM(sl.quantity) 
                     FROM stock_levels sl 
                     WHERE sl.warehouse_id = w.id), 0
                ) AS total_stock_units
            FROM warehouses w
            WHERE w.deleted_at IS NULL
              AND ($1::boolean IS NULL OR w.is_active = $1::boolean)
            ORDER BY w.is_default DESC, w.is_active DESC, w.id ASC
        `;

        const result = await pool.query(query, [activeFilter]);
        return res.status(200).json({
            success: true,
            data: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        console.error('getWarehouses error:', error);
        return res.status(500).json({ success: false, error: 'Failed to retrieve warehouses' });
    }
};

/**
 * 2. GET /api/warehouses/:id
 * Fetch single warehouse details
 */
exports.getWarehouseById = async (req, res) => {
    try {
        await ensureWarehousesTable();
        const { id } = req.params;

        const result = await pool.query(`
            SELECT * FROM warehouses 
            WHERE id = $1 AND deleted_at IS NULL
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Warehouse not found' });
        }

        return res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('getWarehouseById error:', error);
        return res.status(500).json({ success: false, error: 'Failed to retrieve warehouse details' });
    }
};
