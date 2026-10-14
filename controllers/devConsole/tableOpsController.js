const pool = require('../../config/db');

// Allowed tables for force management
const ALLOWED_TABLES = [
    'products',
    'sales',
    'purchase_orders',
    'customers',
    'suppliers',
    'categories',
    'sub_categories',
    'brands',
    'warranty_claims',
    'product_returns',
    'payment_accounts',
    'expenses',
    'users',
    'service_projects'
];

// Force Delete Record (Emergency Override / Developer Bypass)
exports.forceDeleteRecord = async (req, res) => {
    try {
        const { table_name, record_id, reason = 'Super Admin / Developer Emergency Override' } = req.body;

        if (!table_name || !record_id) {
            return res.status(400).json({ success: false, message: 'table_name and record_id are required.' });
        }

        if (!ALLOWED_TABLES.includes(table_name)) {
            return res.status(400).json({ success: false, message: `Table "${table_name}" is not permitted for force deletion.` });
        }

        const existing = await pool.query(`SELECT * FROM ${table_name} WHERE id = $1`, [record_id]);
        if (!existing.rows.length) {
            return res.status(404).json({ success: false, message: `Record #${record_id} not found in ${table_name}.` });
        }

        const row = existing.rows[0];

        // Soft delete if deleted_at column exists, else hard delete
        try {
            await pool.query(`UPDATE ${table_name} SET deleted_at = NOW() WHERE id = $1`, [record_id]);
        } catch {
            await pool.query(`DELETE FROM ${table_name} WHERE id = $1`, [record_id]);
        }

        // Record in trash_records
        await pool.query(`
            INSERT INTO trash_records (table_name, record_id, record_title, record_data, deleted_at)
            VALUES ($1, $2, $3, $4, NOW())
        `, [table_name, record_id, `[FORCE DELETED] ${table_name} #${record_id}`, JSON.stringify(row)]).catch(() => {});

        // Audit Log
        await pool.query(`
            INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data, severity)
            VALUES (1, 'DEV_FORCE_DELETE', $1, $2, $3, $4, 'CRITICAL')
        `, [table_name, record_id, JSON.stringify(row), JSON.stringify({ reason })]).catch(() => {});

        return res.status(200).json({
            success: true,
            message: `Emergency force delete executed on ${table_name} #${record_id}. Moved to trash.`
        });
    } catch (err) {
        console.error('forceDeleteRecord error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Force Update Record (Developer Override)
exports.forceUpdateRecord = async (req, res) => {
    try {
        const { table_name, record_id, fields = {}, reason = 'Developer Console Direct Field Update' } = req.body;

        if (!table_name || !record_id || Object.keys(fields).length === 0) {
            return res.status(400).json({ success: false, message: 'table_name, record_id, and fields are required.' });
        }

        if (!ALLOWED_TABLES.includes(table_name)) {
            return res.status(400).json({ success: false, message: `Table "${table_name}" is not permitted for force edit.` });
        }

        const existing = await pool.query(`SELECT * FROM ${table_name} WHERE id = $1`, [record_id]);
        if (!existing.rows.length) {
            return res.status(404).json({ success: false, message: `Record #${record_id} not found in ${table_name}.` });
        }

        const oldRow = existing.rows[0];
        const updateClauses = [];
        const values = [];

        for (const [key, val] of Object.entries(fields)) {
            // Basic SQL injection protection: only allow alphanumeric and underscore for column names
            if (/^[a-zA-Z0-9_]+$/.test(key) && key !== 'id') {
                values.push(val);
                updateClauses.push(`${key} = $${values.length}`);
            }
        }

        if (!updateClauses.length) {
            return res.status(400).json({ success: false, message: 'No valid fields to update.' });
        }

        values.push(record_id);
        const query = `UPDATE ${table_name} SET ${updateClauses.join(', ')} WHERE id = $${values.length} RETURNING *`;
        const result = await pool.query(query, values);

        // Audit Log
        await pool.query(`
            INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data, severity)
            VALUES (1, 'DEV_FORCE_UPDATE', $1, $2, $3, $4, 'WARN')
        `, [table_name, record_id, JSON.stringify(oldRow), JSON.stringify({ fields, reason })]).catch(() => {});

        return res.status(200).json({
            success: true,
            message: `Force update successfully applied to ${table_name} #${record_id}!`,
            data: result.rows[0]
        });
    } catch (err) {
        console.error('forceUpdateRecord error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Force Clean Inventory Stock (Emergency Developer Tool)
exports.cleanInventoryStock = async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
            success: false,
            message: 'Stock cleanup feature is disabled in production environment.'
        });
    }
    try {
        const { mode = 'zero_stock', reason = 'Dev Console Emergency Stock Reset' } = req.body;

        if (mode === 'wipe_all') {
            await pool.query('DELETE FROM stock_transfers');
            await pool.query('DELETE FROM stock_levels');
            await pool.query('DELETE FROM product_images');

            const wiped = await pool.query(`
                DELETE FROM products 
                WHERE id NOT IN (SELECT product_id FROM sales_items)
                  AND id NOT IN (SELECT product_id FROM purchase_order_items)
                RETURNING id
            `);

            await pool.query('UPDATE products SET stock = 0, updated_at = NOW() WHERE stock != 0');
            await pool.query("DELETE FROM trash_records WHERE table_name = 'products'");

            await pool.query(`
                INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data, severity)
                VALUES (1, 'DEV_WIPE_INVENTORY', 'products', 0, NULL, $1, 'CRITICAL')
            `, [JSON.stringify({ reason, wipedCount: wiped.rowCount })]).catch(() => {});

            return res.status(200).json({
                success: true,
                message: `Inventory wiped clean! (${wiped.rowCount} products removed, remainder zeroed).`
            });
        } else {
            const resUpdated = await pool.query('UPDATE products SET stock = 0, updated_at = NOW() WHERE stock != 0');
            await pool.query('DELETE FROM stock_transfers');
            await pool.query('DELETE FROM stock_levels');

            await pool.query(`
                INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data, severity)
                VALUES (1, 'DEV_ZERO_INVENTORY_STOCK', 'products', 0, NULL, $1, 'WARN')
            `, [JSON.stringify({ reason, updatedCount: resUpdated.rowCount })]).catch(() => {});

            return res.status(200).json({
                success: true,
                message: `All warehouse inventory stocks force reset to 0 (${resUpdated.rowCount} products updated).`
            });
        }
    } catch (err) {
        console.error('cleanInventoryStock error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};
