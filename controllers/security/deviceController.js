const pool = require('../../config/db');
const { ensureSecurityTables } = require('./securitySchema');

// Get Trusted Devices
exports.getDevices = async (req, res) => {
    try {
        await ensureSecurityTables();
        const query = `
            SELECT
                d.*,
                u.name as user_name,
                u.role_name
            FROM trusted_devices d
            LEFT JOIN users u ON d.user_id = u.id
            ORDER BY d.id DESC;
        `;
        const result = await pool.query(query);
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get devices error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Authorize / Register Device
exports.createDevice = async (req, res) => {
    try {
        await ensureSecurityTables();
        const { device_id, device_name, device_type, user_id, browser_info, ip_address } = req.body;
        if (!device_id || !device_name) {
            return res.status(400).json({ success: false, message: "Device ID and device name are required." });
        }

        const query = `
            INSERT INTO trusted_devices (device_id, device_name, device_type, user_id, browser_info, ip_address, is_authorized)
            VALUES ($1, $2, $3, $4, $5, $6, true)
            ON CONFLICT (device_id) DO UPDATE SET
                device_name = EXCLUDED.device_name,
                is_authorized = true,
                last_active = NOW()
            RETURNING *;
        `;
        const result = await pool.query(query, [
            device_id.trim(),
            device_name.trim(),
            device_type || 'desktop',
            user_id ? parseInt(user_id, 10) : null,
            browser_info || null,
            ip_address || null
        ]);

        return res.status(201).json({ success: true, message: "Device authorized successfully!", data: result.rows[0] });
    } catch (error) {
        console.error('Create device error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Update Device Status (Authorize / Revoke)
exports.updateDeviceStatus = async (req, res) => {
    try {
        await ensureSecurityTables();
        const { id } = req.params;
        const { is_authorized } = req.body;

        const result = await pool.query(
            "UPDATE trusted_devices SET is_authorized = $1, last_active = NOW() WHERE id = $2 RETURNING *",
            [Boolean(is_authorized), id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Device not found." });
        }
        return res.status(200).json({ success: true, message: `Device has been ${is_authorized ? 'authorized' : 'blocked/revoked'}.`, data: result.rows[0] });
    } catch (error) {
        console.error('Update device status error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Delete Device
exports.deleteDevice = async (req, res) => {
    try {
        await ensureSecurityTables();
        const { id } = req.params;
        await pool.query("DELETE FROM trusted_devices WHERE id = $1", [id]);
        return res.status(200).json({ success: true, message: "Device removed from list successfully." });
    } catch (error) {
        console.error('Delete device error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
