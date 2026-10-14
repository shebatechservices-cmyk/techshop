const pool = require('../../config/db');
const { ensureSettingsTables } = require('./generalSettingsController');
const {
    fetchTechnicianNotifications,
    fetchGlobalNotifications,
} = require('./health/liveNotificationHelpers');

function formatUptime(seconds) {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
}

// Check Application Updates & Version Matrix
exports.checkAppUpdates = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            currentVersion: 'v16.9.26',
            latestVersion: 'v16.9.26',
            channel: 'Handover Release (Developer Mode Ready)',
            isUpToDate: true,
            lastChecked: new Date().toISOString(),
            releaseDate: 'September 2026',
            changelog: [
                { version: 'v16.9.26', notes: 'Client Handover Release: Full CRUD Accounts & Tenders, Right-aligned Transaction Ledger actions, Force Delete support, and Default Dev Mode integration.' },
                { version: 'v2.8.4', notes: 'Integrated Expense & Overheads management, Warranty claim S/N tracking & swap, SOC Security & Access Control hub, Multi-trigger automated SMS engine.' }
            ]
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// System Health & Environment Status
exports.getSystemHealth = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            health: {
                status: 'HEALTHY',
                uptime: formatUptime(process.uptime()),
                nodeVersion: process.version,
                platform: process.platform,
                memory: {
                    heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
                    heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
                    rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB'
                },
                database: {
                    status: 'CONNECTED',
                    host: process.env.DB_HOST || 'localhost',
                    port: process.env.DB_PORT || 5432,
                    name: process.env.DB_NAME || 'product_catalog',
                    engine: 'PostgreSQL 16'
                }
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Live Real-Time Notifications Feed
exports.getLiveNotifications = async (req, res) => {
    try {
        await ensureSettingsTables();

        // Determine if requesting user is a technician
        const userRole = (req.user?.role_name || req.query.role || '').toLowerCase();
        const roleId = req.user?.role_id ? Number(req.user.role_id) : (req.query.role_id ? Number(req.query.role_id) : null);
        const isTechnician =
            roleId === 4 ||
            userRole.includes('technician') ||
            userRole.includes('tech');
        const technicianId = req.user?.id ? Number(req.user.id) : (req.query.user_id ? Number(req.query.user_id) : null);

        const notifications = isTechnician
            ? await fetchTechnicianNotifications(pool, technicianId)
            : await fetchGlobalNotifications(pool);

        return res.status(200).json({
            success: true,
            count: notifications.length,
            unreadCount: notifications.filter(n => !n.isRead).length,
            data: notifications
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    formatUptime,
    checkAppUpdates: exports.checkAppUpdates,
    getSystemHealth: exports.getSystemHealth,
    getLiveNotifications: exports.getLiveNotifications,
};
