const pool = require('../../config/db');
const { ensureWarehousesTable } = require('./warehouseSchema');

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
