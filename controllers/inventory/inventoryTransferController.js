const pool = require('../../config/db');

// Transfer Stock between Warehouses
const transferStock = async (req, res) => {
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

module.exports = {
    transferStock,
};
