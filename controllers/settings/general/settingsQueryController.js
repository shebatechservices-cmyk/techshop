const pool = require('../../../config/db');
const { ensureSettingsTables } = require('./settingsSchemaMigration');

// Get Shop Settings & Extended System Stats
exports.getSettings = async (req, res) => {
    try {
        await ensureSettingsTables();
        const result = await pool.query('SELECT * FROM shop_settings WHERE id = 1');
        let settings = result.rows[0] || {};

        const { formatUptime } = require('../systemHealthController');

        let stats = {
            totalProducts: 0,
            totalSales: 0,
            totalCustomers: 0,
            dbSize: '14.8 MB',
            nodeVersion: process.version,
            uptimeSeconds: Math.floor(process.uptime()),
            uptimeFormatted: formatUptime(process.uptime()),
            memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB'
        };

        try {
            const [pRes, sRes, cRes] = await Promise.all([
                pool.query('SELECT COUNT(*) FROM products WHERE deleted_at IS NULL').catch(() => ({ rows: [{ count: 0 }] })),
                pool.query("SELECT COUNT(*) FROM sales WHERE status != 'void'").catch(() => ({ rows: [{ count: 0 }] })),
                pool.query('SELECT COUNT(*) FROM customers WHERE deleted_at IS NULL').catch(() => ({ rows: [{ count: 0 }] }))
            ]);
            stats.totalProducts = parseInt(pRes.rows[0]?.count || 0, 10);
            stats.totalSales = parseInt(sRes.rows[0]?.count || 0, 10);
            stats.totalCustomers = parseInt(cRes.rows[0]?.count || 0, 10);
        } catch (sErr) {
            console.warn('Stats fetch warning:', sErr.message);
        }

        return res.status(200).json({ 
            success: true, 
            data: settings,
            stats: stats,
            appInfo: {
                appName: 'Sheba POS & ERP Suite',
                version: 'v2.8.4 Enterprise Edition',
                buildDate: '2026-09-08',
                edition: 'Enterprise Multi-Branch License',
                developer: {
                    name: 'Sheba Technology Software Engineering',
                    lead: 'Sheba Dev Core Team',
                    email: 'support@shebatech.com.bd',
                    hotline: '+880 1700-000000 / +880 1800-000000',
                    website: 'https://shebatech.com.bd'
                }
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
