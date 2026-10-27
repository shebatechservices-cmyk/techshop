const pool = require('../../config/db');

/**
 * Checks if incoming client IP is explicitly blacklisted in ip_rules.
 */
async function checkFirewallRule(clientIp) {
    try {
        const res = await pool.query(
            "SELECT rule_type, reason FROM ip_rules WHERE ip_address = $1",
            [clientIp]
        );
        if (res.rows.length > 0 && res.rows[0].rule_type === 'block') {
            await pool.query(
                "UPDATE ip_rules SET blocked_attempts = blocked_attempts + 1 WHERE ip_address = $1",
                [clientIp]
            ).catch(() => null);
            await pool.query(`
                INSERT INTO audit_logs (action, table_name, ip_address, severity)
                VALUES ('IP_FIREWALL_BLOCKED', 'ip_rules', $1, 'BLOCKED')
            `, [clientIp]).catch(() => null);
            return { blocked: true, reason: res.rows[0].reason };
        }
    } catch (e) {
        // Fallback open if schema is initializing
    }
    return { blocked: false };
}

/**
 * Validates staff allowed network IP and bound hardware device constraints.
 */
async function validateUserAccessConstraints(user, clientIp, deviceId, isSuperAdmin) {
    if (isSuperAdmin) return { allowed: true };

    // 1. Allowed Network IP Check
    if (user.allowed_ip && user.allowed_ip !== 'Any IP') {
        const target = user.allowed_ip.trim();
        const matches = clientIp === target ||
            (target.endsWith('.*') && clientIp.startsWith(target.slice(0, -2))) ||
            clientIp.includes(target);

        if (!matches) {
            await pool.query(`
                INSERT INTO audit_logs (user_id, action, table_name, record_id, ip_address, severity)
                VALUES ($1, 'UNAUTHORIZED_NETWORK_ATTEMPT', 'users', $1, $2, 'WARNING')
            `, [user.id, clientIp]).catch(() => null);
            return {
                allowed: false,
                status: 403,
                message: `Access denied: Account is restricted to network (${user.allowed_ip}). Connection from ${clientIp} rejected.`
            };
        }
    }

    // 2. Bound Device ID Check
    if (user.device_id) {
        const reqDevId = (deviceId || '').trim();
        if (reqDevId && reqDevId !== user.device_id.trim()) {
            return {
                allowed: false,
                status: 403,
                message: `Access denied: Account is bound to device "${user.device_id}". Access from "${reqDevId}" is prohibited.`
            };
        }
    }

    return { allowed: true };
}

/**
 * Normalizes email and BD phone formats for user lookup.
 */
function normalizeLoginPhone(rawIdentifier) {
    const cleanEmail = rawIdentifier.toLowerCase();
    const digitsOnly = rawIdentifier.replace(/[^0-9]/g, '');
    let cleanPhone = rawIdentifier;
    if (digitsOnly.length === 11 && digitsOnly.startsWith('01')) {
        cleanPhone = digitsOnly;
    } else if (digitsOnly.length === 13 && digitsOnly.startsWith('8801')) {
        cleanPhone = '0' + digitsOnly.slice(3);
    }
    return { cleanEmail, cleanPhone };
}

module.exports = {
    checkFirewallRule,
    validateUserAccessConstraints,
    normalizeLoginPhone,
};
