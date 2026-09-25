require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const { requireAuth, getToken, hashSessionToken } = require('./middlewares/authMiddleware');
const app = express();

// Rate limiting for authentication endpoints (public, brute-force targets).
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    skip: (req) => {
        const ip = req.ip || req.connection?.remoteAddress || '';
        return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || req.hostname === 'localhost';
    },
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'অনেক বেশি লগইন চেষ্টা করা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।' },
});

const otpLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'অনেক বেশি অনুরোধ করা হয়েছে। ১ মিনিট পরে আবার চেষ্টা করুন।' },
});

const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://sheba-technology.vercel.app',
    'https://sheba-technology.onrender.com',
];
const envOrigins = (process.env.CORS_ORIGINS || '')
    .split(',').map((origin) => origin.trim()).filter(Boolean);
const allowedOrigins = new Set([...defaultOrigins, ...envOrigins]);

// Strict origin patterns: exact hosts or subdomains of trusted platforms.
const TRUSTED_ORIGIN_PATTERNS = [
    /^https:\/\/([a-z0-9-]+\.)?vercel\.app$/,
    /^https:\/\/([a-z0-9-]+\.)?onrender\.com$/,
];
const isLocalhostOrigin = (origin) => {
    try {
        const { hostname, protocol } = new URL(origin);
        return ['http:', 'https:'].includes(protocol)
            && (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname.endsWith('.localhost'));
    } catch {
        return false;
    }
};

app.use(cors({
    origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.has(origin)) return callback(null, true);
        if (TRUSTED_ORIGIN_PATTERNS.some((re) => re.test(origin)) || isLocalhostOrigin(origin)) {
            return callback(null, true);
        }
        return callback(null, false);
    },
    credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff') }));

app.get('/api', (req, res) => {
    res.json({ message: 'Sheba Technology API is running', version: '16.9.26' });
});

const { checkLicenseKillSwitch } = require('./middlewares/licenseMiddleware');
const publicApiPaths = new Set([
    '/license',
    '/api/license',
    '/security/login',
    '/api/security/login',
    '/security/signup',
    '/api/security/signup',
    '/security/recovery-request',
    '/api/security/recovery-request',
    '/ecommerce/track',
    '/ecommerce/customer/signup',
    '/warranty/check',
    '/devices',
    '/dev',
    '/invoices/temp-share',
    '/api/invoices/temp-share',
    '/sales/temp-share',
    '/api/sales/temp-share',
    '/settings',
    '/api/settings',
    '/expense-categories',
    '/api/expense-categories',
]);

// Tighten rate limits on credential-based public endpoints.
app.use('/api/security/login', authLimiter);
app.use('/api/security/signup', authLimiter);
app.use('/api/security/recovery-request', otpLimiter);

// Global License Kill Switch Middleware
app.use('/api', checkLicenseKillSwitch);
app.use(checkLicenseKillSwitch);

app.use('/api', async (req, res, next) => {
    const rawPath = req.path;
    const origPath = req.originalUrl ? req.originalUrl.split('?')[0] : '';
    const isPublic = [...publicApiPaths].some((p) => {
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

    const token = getToken(req);
    if (token && !req.user) {
        try {
            const pool = require('./config/db');
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

    if (isPublic) return next();
    return requireAuth(req, res, next);
});

// Register API routes on both /api and root prefixes for maximum client compatibility
const registerRoute = (basePath, router) => {
    app.use(`/api${basePath}`, router);
    app.use(basePath, router);
};

registerRoute('/license', require('./routes/licenseRoute'));
registerRoute('/suppliers', require('./routes/supplierRoute'));
registerRoute('/products', require('./routes/productRoute'));
registerRoute('/categories', require('./routes/categoryRoute'));
registerRoute('/master', require('./routes/masterRoute'));
registerRoute('/purchase', require('./routes/purchaseRoute'));
registerRoute('/purchases', require('./routes/purchaseRoute'));
registerRoute('/menu', require('./routes/menuRoute'));
registerRoute('/images', require('./routes/imageRoute'));
registerRoute('/sales', require('./routes/salesRoute'));
registerRoute('/invoices', require('./routes/invoiceRoute'));
registerRoute('/accounts', require('./routes/accountRoute'));
registerRoute('/projects', require('./routes/projectRoute'));
registerRoute('/ecommerce', require('./routes/ecommerceRoute'));
registerRoute('/security', require('./routes/securityRoute'));
registerRoute('/roles', require('./routes/roleRoute'));
registerRoute('/search', require('./routes/searchRoute'));
registerRoute('/warranty', require('./routes/warrantyRoute'));
registerRoute('/trash', require('./routes/trashRoute'));
registerRoute('/settings', require('./routes/settingsRoute'));
registerRoute('/warehouses', require('./routes/warehouseRoute'));
registerRoute('/inventory', require('./routes/inventoryRoute'));
registerRoute('/parties', require('./routes/partyRoute'));
registerRoute('/wallets', require('./routes/walletRoute'));
registerRoute('/reports', require('./routes/reportsRoute'));
registerRoute('/expenses', require('./routes/expenseRoute'));
registerRoute('/expense-categories', require('./routes/expenseCategoryRoute'));
registerRoute('/register', require('./routes/registerRoute'));
registerRoute('/devices', require('./routes/deviceRoute'));
registerRoute('/staff', require('./routes/staffRoute'));
registerRoute('/dev', require('./routes/devRoute'));

// Serve frontend static files in production if built
const distPath = path.join(__dirname, 'frontend/dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.use((req, res, next) => {
        if (req.method === 'GET' && !req.path.startsWith('/api') && req.accepts('html')) {
            return res.sendFile(path.join(distPath, 'index.html'));
        }
        next();
    });
}

// Global JSON error handler: ensure unhandled errors always return JSON, never HTML
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal Server Error'
    });
});

const autoInitDatabase = require('./config/initDb');
autoInitDatabase();

const { startHeartbeatService } = require('./services/heartbeatService');
startHeartbeatService();

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Sheba Technology-এর সার্ভার ${PORT} পোর্টে চলছে...`);
});
