const pool = require('../config/db');

let tableEnsured = false;

/**
 * Ensure the warehouses table and schema exists with all required fields
 */
async function ensureWarehousesTable() {
    if (tableEnsured) return;
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS warehouses (
                id SERIAL PRIMARY KEY,
                name VARCHAR(150) NOT NULL UNIQUE,
                code VARCHAR(50) UNIQUE,
                location TEXT,
                address TEXT,
                contact_person VARCHAR(100),
                phone VARCHAR(50),
                is_default BOOLEAN DEFAULT false,
                is_active BOOLEAN DEFAULT true,
                deleted_at TIMESTAMPTZ DEFAULT NULL,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );

            ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS code VARCHAR(50);
            ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS location TEXT;
            ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS address TEXT;
            ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS contact_person VARCHAR(100);
            ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
            ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
            ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
            ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
            ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
            ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
        `);

        // Check if any warehouses exist; if not, seed default starter warehouses
        const countRes = await pool.query('SELECT COUNT(*) FROM warehouses WHERE deleted_at IS NULL');
        if (parseInt(countRes.rows[0].count, 10) === 0) {
            await pool.query(`
                INSERT INTO warehouses (name, code, location, address, contact_person, phone, is_default, is_active)
                VALUES 
                    ('Main Shop / Head Office', 'WH-MAIN', 'Dhaka Central', 'Motijheel, Dhaka', 'Store Manager', '01700000000', true, true),
                    ('Central Godown', 'WH-GODOWN', 'Tejgaon Industrial Area', 'Tejgaon, Dhaka', 'Warehouse Officer', '01800000000', false, true),
                    ('Service & Warranty Center', 'WH-SERVICE', 'Dhanmondi Branch', 'Dhanmondi, Dhaka', 'Service Lead', '01900000000', false, true)
                ON CONFLICT (name) DO NOTHING;
            `);
        }

        tableEnsured = true;
    } catch (err) {
        console.error('ensureWarehousesTable error:', err.message);
    }
}

// Ensure schema on boot
ensureWarehousesTable().catch(() => null);

exports.ensureWarehousesTable = ensureWarehousesTable;

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

/**
 * 3. POST /api/warehouses
 * Create a new warehouse
 */
exports.createWarehouse = async (req, res) => {
    const client = await pool.connect();
    try {
        await ensureWarehousesTable();
        const { name, code, location, address, contact_person, phone, is_default, is_active } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, error: 'Warehouse name is required' });
        }

        await client.query('BEGIN');

        // Check name uniqueness
        const nameCheck = await client.query(
            'SELECT id FROM warehouses WHERE LOWER(name) = LOWER($1) AND deleted_at IS NULL',
            [name.trim()]
        );
        if (nameCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ success: false, error: `Warehouse "${name}" already exists` });
        }

        const makeDefault = Boolean(is_default);

        // If setting as default, unset existing default
        if (makeDefault) {
            await client.query('UPDATE warehouses SET is_default = false WHERE deleted_at IS NULL');
        }

        const autoCode = (code && code.trim()) || `WH-${Date.now().toString().slice(-4)}`;

        const insertQuery = `
            INSERT INTO warehouses (
                name, code, location, address, contact_person, phone, is_default, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        const result = await client.query(insertQuery, [
            name.trim(),
            autoCode.toUpperCase(),
            location ? location.trim() : null,
            address ? address.trim() : null,
            contact_person ? contact_person.trim() : null,
            phone ? phone.trim() : null,
            makeDefault,
            is_active !== undefined ? Boolean(is_active) : true
        ]);

        await client.query('COMMIT');

        return res.status(201).json({
            success: true,
            message: `Warehouse "${result.rows[0].name}" created successfully`,
            data: result.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('createWarehouse error:', error);
        return res.status(500).json({ success: false, error: error.message || 'Failed to create warehouse' });
    } finally {
        client.release();
    }
};

/**
 * 4. PUT /api/warehouses/:id
 * Update warehouse details
 */
exports.updateWarehouse = async (req, res) => {
    const client = await pool.connect();
    try {
        await ensureWarehousesTable();
        const { id } = req.params;
        const { name, code, location, address, contact_person, phone, is_default, is_active } = req.body;

        const existing = await client.query('SELECT * FROM warehouses WHERE id = $1 AND deleted_at IS NULL', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Warehouse not found' });
        }

        await client.query('BEGIN');

        if (name && name.trim()) {
            const nameCheck = await client.query(
                'SELECT id FROM warehouses WHERE LOWER(name) = LOWER($1) AND id != $2 AND deleted_at IS NULL',
                [name.trim(), id]
            );
            if (nameCheck.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(409).json({ success: false, error: `Warehouse name "${name}" is already in use` });
            }
        }

        const makeDefault = is_default !== undefined ? Boolean(is_default) : existing.rows[0].is_default;
        if (makeDefault) {
            await client.query('UPDATE warehouses SET is_default = false WHERE id != $1 AND deleted_at IS NULL', [id]);
        }

        const updateQuery = `
            UPDATE warehouses SET
                name = COALESCE($1, name),
                code = COALESCE($2, code),
                location = COALESCE($3, location),
                address = COALESCE($4, address),
                contact_person = COALESCE($5, contact_person),
                phone = COALESCE($6, phone),
                is_default = $7,
                is_active = COALESCE($8, is_active),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $9
            RETURNING *
        `;

        const result = await client.query(updateQuery, [
            name ? name.trim() : null,
            code ? code.trim().toUpperCase() : null,
            location !== undefined ? (location ? location.trim() : null) : null,
            address !== undefined ? (address ? address.trim() : null) : null,
            contact_person !== undefined ? (contact_person ? contact_person.trim() : null) : null,
            phone !== undefined ? (phone ? phone.trim() : null) : null,
            makeDefault,
            is_active !== undefined ? Boolean(is_active) : null,
            id
        ]);

        await client.query('COMMIT');

        return res.status(200).json({
            success: true,
            message: `Warehouse "${result.rows[0].name}" updated successfully`,
            data: result.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('updateWarehouse error:', error);
        return res.status(500).json({ success: false, error: error.message || 'Failed to update warehouse' });
    } finally {
        client.release();
    }
};

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
