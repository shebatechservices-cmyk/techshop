const rateLimit = require('express-rate-limit');

// Rate limiting for authentication endpoints (public, brute-force targets).
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    skip: (req) => {
        if (req.method === 'OPTIONS') return true;
        const ip = req.ip || req.connection?.remoteAddress || '';
        return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || req.hostname === 'localhost';
    },
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many login attempts. Please try again in a few moments.' },
});

const otpLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    skip: (req) => req.method === 'OPTIONS',
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please try again in 1 minute.' },
});

const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost',
    'https://localhost',
    'capacitor://localhost',
    'https://sheba-technology.onrender.com',
    'https://sdb.shebatechnologybd.com',
    'https://shebatechnologybd.com',
];

const envOrigins = (process.env.CORS_ORIGINS || '')
    .split(',').map((origin) => origin.trim()).filter(Boolean);
const allowedOrigins = new Set([...defaultOrigins, ...envOrigins]);

// Strict origin patterns: exact hosts or subdomains of trusted platforms.
const TRUSTED_ORIGIN_PATTERNS = [
    /^https:\/\/([a-z0-9-]+\.)?onrender\.com$/,
    /^https:\/\/([a-z0-9-]+\.)?shebatechnologybd\.com$/,
    /^https:\/\/([a-z0-9-]+\.)?trycloudflare\.com$/,
    /^capacitor:\/\/localhost$/,
];

const isLocalOrPrivateNetworkOrigin = (origin) => {
    try {
        if (!origin) return false;
        if (origin === 'null') return true;
        const { hostname, protocol } = new URL(origin);
        if (!['http:', 'https:', 'capacitor:', 'ionic:'].includes(protocol)) return false;
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname.endsWith('.localhost')) return true;
        // Standard IPv4 private ranges:
        if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
        if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
        if (/^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
        if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
        if (/^169\.254\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
        return false;
    } catch {
        return false;
    }
};

const corsOptions = {
    origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.has(origin)) return callback(null, true);
        if (TRUSTED_ORIGIN_PATTERNS.some((re) => re.test(origin)) || isLocalOrPrivateNetworkOrigin(origin)) {
            return callback(null, true);
        }
        return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-session-token', 'X-Requested-With', 'Accept', 'Origin', 'Access-Control-Request-Private-Network'],
};

module.exports = {
    authLimiter,
    otpLimiter,
    corsOptions,
};
