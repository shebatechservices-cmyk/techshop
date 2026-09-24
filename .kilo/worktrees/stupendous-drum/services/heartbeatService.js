const pool = require('../config/db');
const packageJson = require('../package.json');

const APP_VERSION = packageJson.version || '16.9.26';
const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
let timerId = null;

const getHardwareFingerprint = () => {
    try {
        const os = require('os');
        const crypto = require('crypto');
        const netInterfaces = os.networkInterfaces();
        const macs = [];
        for (const key of Object.keys(netInterfaces)) {
            for (const net of netInterfaces[key] || []) {
                if (net.mac && net.mac !== '00:00:00:00:00:00') {
                    macs.push(net.mac);
                }
            }
        }
        const raw = `${os.hostname()}-${os.platform()}-${os.arch()}-${macs.sort().join(',')}`;
        return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 32).toUpperCase();
    } catch {
        return 'SHEBA-HW-GENERIC-NODE';
    }
};

const sendHeartbeatPing = async () => {
    try {
        const vendorUrl = process.env.VENDOR_API_URL || process.env.VENDOR_SERVER_URL || 'http://localhost:5000';
        const clientAppId = process.env.CLIENT_APP_ID || 'CLIENT-SHEBA-TECH-8801';
        const hwId = getHardwareFingerprint();

        const cacheRes = await pool.query('SELECT * FROM vendor_license_cache ORDER BY id DESC LIMIT 1')
            .catch(() => ({ rows: [] }));
        const cached = cacheRes.rows[0] || {};

        const payload = {
            client_app_id: clientAppId,
            hardware_id: hwId,
            domain: cached.domain_name || 'localhost',
            current_version: APP_VERSION,
            status: cached.status || 'active',
            timestamp: new Date().toISOString(),
        };

        if (vendorUrl && !vendorUrl.includes('shebatech.com.bd/api')) {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 5000);
                const res = await fetch(`${vendorUrl}/api/vendor/heartbeat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    signal: controller.signal,
                });
                clearTimeout(timeout);

                if (res.ok) {
                    const data = await res.json();
                    if (data && data.status && data.status !== cached.status) {
                        await pool.query(
                            'UPDATE vendor_license_cache SET status = $1, last_sync_at = NOW() WHERE id = $2',
                            [data.status, cached.id]
                        ).catch(() => null);
                        await pool.query(
                            'UPDATE shop_settings SET license_status = $1 WHERE id = (SELECT id FROM shop_settings LIMIT 1)',
                            [data.status]
                        ).catch(() => null);
                    }
                }
            } catch (netErr) {
                // Background ping retry on next interval
            }
        }
    } catch (err) {
        console.warn('Heartbeat ping notice:', err.message);
    }
};

const startHeartbeatService = () => {
    if (timerId) clearInterval(timerId);
    // Initial ping after 5 seconds on startup
    setTimeout(sendHeartbeatPing, 5000);
    timerId = setInterval(sendHeartbeatPing, HEARTBEAT_INTERVAL_MS);
    console.log('💓 Vendor heartbeat background service initialized.');
};

const stopHeartbeatService = () => {
    if (timerId) {
        clearInterval(timerId);
        timerId = null;
    }
};

module.exports = {
    startHeartbeatService,
    stopHeartbeatService,
    sendHeartbeatPing,
    getHardwareFingerprint,
};
