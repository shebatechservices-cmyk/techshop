const pool = require('../config/db');

let cachedLicenseState = null;
let lastCheckTime = 0;
const CACHE_TTL_MS = 30 * 1000; // 30 seconds

// Paths that must always remain accessible even if license is suspended/expired
const EXEMPT_PATHS = [
    '/license',
    '/security/login',
    '/security/signup',
    '/security/recovery-request',
    '/security/session-verify',
    '/security/logout',
    '/dev',
];

const checkLicenseKillSwitch = async (req, res, next) => {
    try {
        const path = req.path || '';

        // Allow exempt paths
        const isExempt = EXEMPT_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
        if (isExempt) return next();

        const now = Date.now();
        if (!cachedLicenseState || now - lastCheckTime > CACHE_TTL_MS) {
            const cacheRes = await pool.query('SELECT status, license_expiry, offline_grace_until FROM vendor_license_cache ORDER BY id DESC LIMIT 1')
                .catch(() => ({ rows: [] }));
            if (cacheRes.rows.length) {
                cachedLicenseState = cacheRes.rows[0];
            } else {
                cachedLicenseState = { status: 'active', license_expiry: null };
            }
            lastCheckTime = now;
        }

        const isSuspended = String(cachedLicenseState.status || '').toLowerCase() === 'suspended';
        const isExpired = cachedLicenseState.license_expiry && new Date(cachedLicenseState.license_expiry).getTime() < now;

        if (isSuspended || isExpired) {
            const reason = isSuspended ? 'suspended' : 'expired';
            return res.status(403).json({
                success: false,
                code: 'LICENSE_BLOCKED',
                status: reason,
                message: isSuspended
                    ? 'Software access has been suspended by the vendor. Please contact support.'
                    : 'Software license has expired. Please renew your subscription to continue using the system.',
            });
        }

        return next();
    } catch (err) {
        // Fail-open on internal middleware error to avoid disrupting business
        return next();
    }
};

const resetLicenseCache = () => {
    cachedLicenseState = null;
    lastCheckTime = 0;
};

module.exports = { checkLicenseKillSwitch, resetLicenseCache };
