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
    message: { success: false, message: 'Too many login attempts. Please try again in a few moments.' },
});

const otpLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please try again in 1 minute.' },
});

const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://sheba-technology.vercel.app',
    'https://sheba-technology.onrender.com',
    'https://sdb.shebatechnologybd.com',
    'https://shebatechnologybd.com',
];
const envOrigins = (process.env.CORS_ORIGINS || '')
    .split(',').map((origin) => origin.trim()).filter(Boolean);
const allowedOrigins = new Set([...defaultOrigins, ...envOrigins]);

// Strict origin patterns: exact hosts or subdomains of trusted platforms.
const TRUSTED_ORIGIN_PATTERNS = [
    /^https:\/\/([a-z0-9-]+\.)?vercel\.app$/,
    /^https:\/\/([a-z0-9-]+\.)?onrender\.com$/,
    /^https:\/\/([a-z0-9-]+\.)?shebatechnologybd\.com$/,
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

// Ensure upload directories exist and sync persistent default uploads
const ensureUploadsExist = () => {
    try {
        const uploadsBase = path.join(__dirname, 'uploads');
        const defaultBase = path.join(__dirname, 'storage', 'default_uploads');
        ['logos', 'products', 'temp_shares'].forEach(sub => {
            fs.mkdirSync(path.join(uploadsBase, sub), { recursive: true });
        });
        if (fs.existsSync(defaultBase)) {
            ['logos', 'products'].forEach(sub => {
                const srcDir = path.join(defaultBase, sub);
                const destDir = path.join(uploadsBase, sub);
                if (fs.existsSync(srcDir)) {
                    fs.readdirSync(srcDir).forEach(file => {
                        const destFile = path.join(destDir, file);
                        if (!fs.existsSync(destFile)) {
                            fs.copyFileSync(path.join(srcDir, file), destFile);
                        }
                    });
                }
            });
        }
    } catch (e) {
        console.warn('Notice: upload sync fallback:', e.message);
    }
};
ensureUploadsExist();

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

// Global License Kill Switch Middleware for API requests
app.use('/api', checkLicenseKillSwitch);

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

// Register API routes strictly under /api prefix so they do not conflict with frontend SPA routes
const registerRoute = (basePath, router) => {
    app.use(`/api${basePath}`, router);
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
registerRoute('/uom', require('./routes/uomRoute'));
registerRoute('/units-of-measurement', require('./routes/uomRoute'));

const createEntityRouter = require('./routes/entityRouteFactory');
registerRoute('/brands', createEntityRouter('brands'));
registerRoute('/models', createEntityRouter('models'));
registerRoute('/series', createEntityRouter('series'));
registerRoute('/product-names', createEntityRouter('product_names'));
registerRoute('/product_names', createEntityRouter('product_names'));
registerRoute('/sub-categories', createEntityRouter('sub_categories'));
registerRoute('/sub_categories', createEntityRouter('sub_categories'));

// Serve frontend static assets in production if built
const distPath = path.join(__dirname, 'frontend/dist');
if (fs.existsSync(distPath)) {
    // Explicitly prevent caching of the Service Worker script
    app.get('/sw.js', (req, res) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.sendFile(path.join(distPath, 'sw.js'));
    });
    app.use(express.static(distPath));
}

// 404 handler for unmatched /api or /uploads requests (returns JSON, never HTML)
app.use(['/api', '/uploads'], (req, res) => {
    res.status(404).json({
        success: false,
        error: `${req.baseUrl ? req.baseUrl.slice(1) : 'Resource'} not found`,
        path: req.originalUrl
    });
});

// Catch-all route to serve the React SPA index.html for all non-API GET requests
app.use((req, res, next) => {
    if (req.method === 'GET') {
        const indexPath = path.join(__dirname, 'frontend/dist/index.html');
        if (fs.existsSync(indexPath)) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            return res.sendFile(indexPath);
        }
        return res.status(404).send('Frontend build not found. Please build the frontend application.');
    }
    next();
});

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
