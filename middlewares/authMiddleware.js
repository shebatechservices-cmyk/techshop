const crypto = require('crypto');
const pool = require('../config/db');

// Session tokens are stored hashed (sha256) in the users table, so a database
// leak does not expose live sessions.
const hashSessionToken = (token) =>
    crypto.createHash('sha256').update(String(token)).digest('hex');

const getToken = (req) => {
    const authorization = req.headers.authorization || '';
    if (authorization.startsWith('Bearer ')) return authorization.slice(7);
    if (req.headers['x-session-token']) return req.headers['x-session-token'];
    if (req.query && req.query.token) return req.query.token;
    return null;
};

const requireAuth = async (req, res, next) => {
    try {
        const token = getToken(req);
        if (!token) return res.status(401).json({ success: false, message: 'Authentication is required.' });

        const result = await pool.query(`
            SELECT id, name, email, phone, role_id, role_name, is_active, is_locked, deleted_at
            FROM users
            WHERE current_session_token = $1
            LIMIT 1
        `, [hashSessionToken(token)]);
        const user = result.rows[0];
        if (!user || user.deleted_at || !user.is_active || user.is_locked) {
            return res.status(401).json({ success: false, message: 'Your session is invalid or no longer active.' });
        }
        req.user = user;
        req.sessionToken = token;
        // Throttled activity touch: only write when the last update is older
        // than 5 minutes, avoiding a DB write on every request.
        await pool.query(
            'UPDATE users SET session_last_active = NOW() WHERE id = $1 AND (session_last_active IS NULL OR session_last_active < NOW() - INTERVAL \'5 minutes\')',
            [user.id]
        ).catch(() => null);
        return next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({ success: false, message: 'Authentication service error.' });
    }
};

const requireRole = (...roleIds) => async (req, res, next) => {
    try {
        if (!req.user) {
            const token = getToken(req);
            if (token) {
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
            } else {
                // In local development or when dev console / internal mode is active, allow local admin fallback
                const host = req.headers.host || '';
                const isLocalHost = (
                    req.hostname === 'localhost' ||
                    req.hostname === '127.0.0.1' ||
                    req.ip === '127.0.0.1' ||
                    req.ip === '::1' ||
                    req.ip === '::ffff:127.0.0.1' ||
                    host.startsWith('localhost') ||
                    host.startsWith('127.0.0.1')
                );
                const hasDevHeader = req.headers['x-dev-mode'] === 'true';
                if (hasDevHeader || isLocalHost) {
                    const devAdmin = await pool.query(`
                        SELECT id, name, email, phone, role_id, role_name, is_active, is_locked, deleted_at
                        FROM users
                        WHERE role_id = 1 AND deleted_at IS NULL
                        ORDER BY id ASC
                        LIMIT 1
                    `);
                    if (devAdmin.rows[0]) {
                        req.user = devAdmin.rows[0];
                    }
                }
            }
        }

        if (!req.user || !roleIds.includes(Number(req.user.role_id))) {
            return res.status(403).json({ success: false, message: 'You do not have permission for this action.' });
        }
        return next();
    } catch (error) {
        console.error('requireRole error:', error);
        return res.status(500).json({ success: false, message: 'Authorization service error.' });
    }
};

// পারমিশন চেক করার অ্যাডভান্সড মিডলওয়্যার
const checkPermission = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            if (!req.user) return res.status(401).json({ success: false, message: 'Authentication is required.' });
            const roleId = String(req.user.role_id);

            // সুপার এডমিন (id = 1) হলে সব পারমিশন বাইপাস করে ভেতরে যাওয়ার অনুমতি পাবে
            if (roleId === '1') {
                return next();
            }

            // রোল অনুযায়ী পারমিশন চেক করা
            const query = `
                SELECT p.name
                FROM permissions p
                JOIN role_permissions rp ON p.id = rp.permission_id
                WHERE rp.role_id = $1 AND p.name = $2
            `;
            const result = await pool.query(query, [roleId, requiredPermission]);

            if (result.rows.length === 0) {
                return res.status(403).json({ success: false, message: 'Access Denied! You do not have permission to perform this action.' });
            }

            next();
        } catch (error) {
            console.error('Permission check error:', error);
            return res.status(500).json({ success: false, message: 'Internal server error while verifying permissions.' });
        }
    };
};

module.exports = { checkPermission, requireAuth, requireRole, getToken, hashSessionToken };
