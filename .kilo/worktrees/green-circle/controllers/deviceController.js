const pool = require('../config/db');

let tableReady = false;

async function ensureDeviceTable() {
    if (tableReady) return;
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS device_sessions (
                id SERIAL PRIMARY KEY,
                device_id VARCHAR(100) UNIQUE NOT NULL,
                device_type VARCHAR(20) NOT NULL, -- 'desktop' or 'mobile'
                device_name VARCHAR(200) NOT NULL,
                ip_address VARCHAR(100),
                user_agent TEXT,
                last_active TIMESTAMP DEFAULT NOW(),
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        tableReady = true;
    } catch (err) {
        console.error('ensureDeviceTable error:', err.message);
    }
}

// Helper to get active counts
async function getActiveCounts() {
    const res = await pool.query(`
        SELECT device_type, COUNT(*)::int as count 
        FROM device_sessions 
        GROUP BY device_type
    `);
    const counts = { desktop: 0, mobile: 0, maxDesktop: 15, maxMobile: 15 };
    for (const r of res.rows) {
        if (r.device_type === 'desktop') counts.desktop = r.count;
        if (r.device_type === 'mobile') counts.mobile = r.count;
    }
    return counts;
}

// 1. Check or Register Device
exports.checkOrRegisterDevice = async (req, res) => {
    try {
        await ensureDeviceTable();
        // Auto-prune stale device sessions inactive for more than 2 hours
        await pool.query("DELETE FROM device_sessions WHERE last_active < NOW() - INTERVAL '2 hours'").catch(() => null);

        const { device_id, device_type = 'desktop', device_name = 'Unknown Device' } = req.body;
        const normType = (device_type || 'desktop').toLowerCase() === 'mobile' ? 'mobile' : 'desktop';
        const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
        const userAgent = req.headers['user-agent'] || '';

        if (!device_id) {
            return res.status(400).json({ allowed: false, message: 'Device ID is required.' });
        }

        // Check if device already exists
        const existing = await pool.query(
            'SELECT * FROM device_sessions WHERE device_id = $1',
            [device_id]
        );

        if (existing.rows.length > 0) {
            // Already registered device; refresh activity
            const updated = await pool.query(
                `UPDATE device_sessions 
                 SET last_active = NOW(), 
                     device_name = COALESCE(NULLIF($1, ''), device_name),
                     ip_address = $2,
                     user_agent = $3
                 WHERE device_id = $4 
                 RETURNING *`,
                [device_name, clientIp, userAgent, device_id]
            );

            const counts = await getActiveCounts();
            return res.status(200).json({
                allowed: true,
                is_new: false,
                session: updated.rows[0],
                counts
            });
        }

        // New device: check slot availability for this device_type
        const limitMax = 15;
        const countRes = await pool.query(
            'SELECT COUNT(*)::int as count FROM device_sessions WHERE device_type = $1',
            [normType]
        );
        const currentCount = countRes.rows[0]?.count || 0;

        if (currentCount >= limitMax) {
            // Slot limit exceeded! Return active devices so user can log out an old device
            const activeList = await pool.query(
                'SELECT * FROM device_sessions WHERE device_type = $1 ORDER BY last_active DESC',
                [normType]
            );
            const counts = await getActiveCounts();

            return res.status(403).json({
                allowed: false,
                message: `Device access limit reached! Maximum ${limitMax} ${normType === 'desktop' ? 'Desktops/Laptops' : 'Mobile Phones'} allowed simultaneously.`,
                device_type: normType,
                current_count: currentCount,
                max_limit: limitMax,
                active_devices: activeList.rows,
                counts
            });
        }

        // Slot available: Register device
        const newSession = await pool.query(
            `INSERT INTO device_sessions 
             (device_id, device_type, device_name, ip_address, user_agent, last_active)
             VALUES ($1, $2, $3, $4, $5, NOW())
             RETURNING *`,
            [device_id, normType, device_name, clientIp, userAgent]
        );

        const counts = await getActiveCounts();
        return res.status(201).json({
            allowed: true,
            is_new: true,
            session: newSession.rows[0],
            counts
        });
    } catch (err) {
        console.error('checkOrRegisterDevice error:', err);
        return res.status(500).json({ allowed: false, message: err.message });
    }
};

// 2. Get All Devices
exports.getDevices = async (req, res) => {
    try {
        await ensureDeviceTable();
        const result = await pool.query('SELECT * FROM device_sessions ORDER BY last_active DESC');
        const counts = await getActiveCounts();

        const desktops = result.rows.filter(d => d.device_type === 'desktop');
        const mobiles = result.rows.filter(d => d.device_type === 'mobile');

        return res.status(200).json({
            success: true,
            counts,
            devices: result.rows,
            desktops,
            mobiles
        });
    } catch (err) {
        console.error('getDevices error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 3. Logout / Deregister Device (Free up Slot)
exports.deleteDevice = async (req, res) => {
    try {
        await ensureDeviceTable();
        const { device_id } = req.params;
        const targetId = device_id || req.body?.device_id;

        if (!targetId) {
            return res.status(400).json({ success: false, message: 'Device ID is required.' });
        }

        const delRes = await pool.query(
            'DELETE FROM device_sessions WHERE device_id = $1 RETURNING *',
            [targetId]
        );

        if (delRes.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Device session not found or already logged out.' });
        }

        const counts = await getActiveCounts();
        return res.status(200).json({
            success: true,
            message: `Device "${delRes.rows[0].device_name}" successfully logged out. Slot has been freed!`,
            freed_device: delRes.rows[0],
            counts
        });
    } catch (err) {
        console.error('deleteDevice error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 4. Rename Device
exports.renameDevice = async (req, res) => {
    try {
        await ensureDeviceTable();
        const { device_id } = req.params;
        const { device_name } = req.body;

        if (!device_name || !device_name.trim()) {
            return res.status(400).json({ success: false, message: 'Device name is required.' });
        }

        const updated = await pool.query(
            'UPDATE device_sessions SET device_name = $1 WHERE device_id = $2 RETURNING *',
            [device_name.trim(), device_id]
        );

        if (updated.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Device session not found.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Device name updated.',
            session: updated.rows[0]
        });
    } catch (err) {
        console.error('renameDevice error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};
