const pool = require('../../config/db');
const { ensureSecurityTables } = require('./securitySchema');
const userManagement = require('./userManagementController');
const userEdit = require('./userEditController');
const staffApproval = require('./staffApprovalController');

// Global Audit Log Creation
exports.createAuditLog = async (userId, action, tableName, recordId, oldData, newData, ipAddress, severity = 'INFO', deviceId = null) => {
    try {
        await ensureSecurityTables();
        const query = `
            INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data, ip_address, severity, device_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `;
        await pool.query(query, [
            userId || null,
            action,
            tableName,
            recordId || null,
            oldData ? JSON.stringify(oldData) : null,
            newData ? JSON.stringify(newData) : null,
            ipAddress || '127.0.0.1',
            severity,
            deviceId || null
        ]);
    } catch (error) {
        console.error('Audit log creation error:', error.message);
    }
};

// 1. Get Security Overview & Health Metrics
exports.getSecurityOverview = async (req, res) => {
    try {
        await ensureSecurityTables();
        const [usersRes, devicesRes, ipRes, logsRes] = await Promise.all([
            pool.query("SELECT id, is_active, is_locked, role_name FROM users"),
            pool.query("SELECT id, is_authorized FROM trusted_devices"),
            pool.query("SELECT rule_type, blocked_attempts FROM ip_rules"),
            pool.query("SELECT id, severity FROM audit_logs WHERE created_at >= NOW() - INTERVAL '24 HOURS'")
        ]);

        const totalUsers = usersRes.rows.length;
        const activeUsers = usersRes.rows.filter(u => u.is_active && !u.is_locked).length;
        const lockedUsers = usersRes.rows.filter(u => u.is_locked).length;
        const technicians = usersRes.rows.filter(u => (u.role_name || '').toLowerCase().includes('technician')).length;

        const totalDevices = devicesRes.rows.length;
        const authorizedDevices = devicesRes.rows.filter(d => d.is_authorized).length;

        let totalBlockedAttempts = 0;
        ipRes.rows.forEach(r => {
            if (r.rule_type === 'block') totalBlockedAttempts += (Number(r.blocked_attempts) || 0);
        });

        const recentCriticals = logsRes.rows.filter(l => l.severity === 'CRITICAL' || l.severity === 'BLOCKED').length;

        // Dynamic Health Score calculation
        let healthScore = 98;
        if (lockedUsers > 0) healthScore -= 2;
        if (recentCriticals > 5) healthScore -= 5;
        if (totalDevices > authorizedDevices) healthScore -= 3;

        return res.status(200).json({
            success: true,
            data: {
                healthScore: Math.max(80, healthScore),
                totalUsers,
                activeUsers,
                lockedUsers,
                technicians,
                totalDevices,
                authorizedDevices,
                totalBlockedAttempts,
                recentCriticals,
                ipRulesCount: ipRes.rows.length,
                perimeterStatus: 'ACTIVE_SHIELD'
            }
        });
    } catch (error) {
        console.error('Get security overview error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Get Audit Logs
exports.getAuditLogs = async (req, res) => {
    try {
        await ensureSecurityTables();
        const { severity, limit = 200 } = req.query;
        let query = `
            SELECT
                l.*,
                u.name as user_name,
                u.phone as user_phone,
                u.role_name
            FROM audit_logs l
            LEFT JOIN users u ON l.user_id = u.id
        `;
        const params = [];
        if (severity && severity !== 'ALL') {
            query += " WHERE l.severity = $1";
            params.push(severity.toUpperCase());
        }
        const maxLimit = Math.min(parseInt(limit, 10) || 200, 500);
        query += ` ORDER BY l.id DESC LIMIT $${params.length + 1};`;
        params.push(maxLimit);
        const result = await pool.query(query, params);
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get audit logs error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Re-exports for User / Staff Management
exports.getUsers = userManagement.getUsers;
exports.createUser = userManagement.createUser;
exports.updateUserStatus = userManagement.updateUserStatus;

exports.updateUser = userEdit.updateUser;
exports.deleteUser = userEdit.deleteUser;

exports.getPendingStaff = staffApproval.getPendingStaff;
exports.approveStaff = staffApproval.approveStaff;
