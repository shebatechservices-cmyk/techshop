const { requireAuth, getToken, hashSessionToken } = require('./authMiddleware');
const pool = require('../config/db');

const publicApiPaths = new Set([
    '/license',
    '/api/license',
    '/security/login',
    '/api/security/login',
    '/security/signup',
    '/api/security/signup',
    '/security/recovery-request',
    '/api/security/recovery-request',
    '/security/verify-device-2fa',
    '/api/security/verify-device-2fa',
    '/security/check-device-approval',
    '/api/security/check-device-approval',
    '/ecommerce/track',
    '/ecommerce/customer/signup',
    '/warranty/check',
    '/devices',
    '/invoices/temp-share',
    '/api/invoices/temp-share',
    '/sales/temp-share',
    '/api/sales/temp-share',
    '/settings',
    '/api/settings',
    '/expense-categories',
    '/api/expense-categories',
]);

const publicGetPaths = new Set([
    '/master',
    '/products',
    '/categories',
    '/sub-categories',
    '/sub_categories',
    '/brands',
    '/models',
    '/series',
    '/product-names',
    '/product_names',
    '/uom',
    '/units-of-measurement',
    '/search',
    '/ecommerce',
    '/warranty',
]);

const publicPostPaths = new Set([
    '/ecommerce/orders',
]);

const matchesPrefix = (pathSet, rawPath, origPath) => {
    return [...pathSet].some((p) => {
        const cleanP = p.startsWith('/api') ? p.replace(/^\/api/, '') : p;
        return (
            rawPath === cleanP ||
            rawPath.startsWith(`${cleanP}/`) ||
            rawPath === p ||
            rawPath.startsWith(`${p}/`) ||
            origPath === p ||
            origPath.startsWith(`${p}/`) ||
            origPath === `/api${cleanP}` ||
            origPath.startsWith(`/api${cleanP}/`)
        );
    });
};

const apiAuthGate = async (req, res, next) => {
    if (req.method === 'OPTIONS') return next();
    const rawPath = req.path;
    const origPath = req.originalUrl ? req.originalUrl.split('?')[0] : '';
    const isPublic =
        matchesPrefix(publicApiPaths, rawPath, origPath) ||
        (req.method === 'GET' && matchesPrefix(publicGetPaths, rawPath, origPath)) ||
        (req.method === 'POST' && matchesPrefix(publicPostPaths, rawPath, origPath));

    const token = getToken(req);
    if (token && !req.user) {
        try {
            const result = await pool.query(`
                SELECT id, name, email, phone, role_id, role_name, is_active, is_locked, deleted_at
                FROM users
                WHERE current_session_token = $1
                LIMIT 1
            `, [hashSessionToken(token)]);
            const user = result.rows[0];
            if (user && !user.deleted_at && user.is_active && !user.is_locked) {
                req.user = user;
                req.sessionToken = token;
            }
        } catch (_) {}
    }

    const devSecret = req.headers['x-dev-secret'] || req.headers['x-dev-password'];
    if ((rawPath.startsWith('/dev') || origPath.startsWith('/api/dev')) && devSecret) {
        return next();
    }

    if (isPublic) return next();
    return requireAuth(req, res, next);
};

module.exports = {
    publicApiPaths,
    publicGetPaths,
    publicPostPaths,
    apiAuthGate,
};
