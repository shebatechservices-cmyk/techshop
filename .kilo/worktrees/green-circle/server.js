const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { requireAuth } = require('./middlewares/authMiddleware');
const app = express();

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
    res.json({ message: 'Sheba Technology API is running', version: '2.8.4-beta' });
});

const publicApiPaths = new Set([
    '/security/login',
    '/security/signup',
    '/security/recovery-request',
    '/ecommerce/track',
    '/ecommerce/customer/signup',
    '/warranty/check',
    '/devices/check-or-register',
]);
app.use('/api', (req, res, next) => {
    if ([...publicApiPaths].some((path) => req.path === path || req.path.startsWith(`${path}/`))) return next();
    return requireAuth(req, res, next);
});

// Keep every API behind the /api prefix. The former unprefixed aliases bypassed
// authorization entirely.
const registerRoute = (basePath, router) => {
    app.use(`/api${basePath}`, router);
};

registerRoute('/suppliers', require('./routes/supplierRoute'));
registerRoute('/products', require('./routes/productRoute'));
registerRoute('/categories', require('./routes/categoryRoute'));
registerRoute('/master', require('./routes/masterRoute'));
registerRoute('/purchase', require('./routes/purchaseRoute'));
registerRoute('/menu', require('./routes/menuRoute'));
registerRoute('/images', require('./routes/imageRoute'));
registerRoute('/sales', require('./routes/salesRoute'));
registerRoute('/accounts', require('./routes/accountRoute'));
registerRoute('/projects', require('./routes/projectRoute'));
registerRoute('/ecommerce', require('./routes/ecommerceRoute'));
registerRoute('/security', require('./routes/securityRoute'));
registerRoute('/roles', require('./routes/roleRoute'));
registerRoute('/search', require('./routes/searchRoute'));
registerRoute('/warranty', require('./routes/warrantyRoute'));
registerRoute('/trash', require('./routes/trashRoute'));
registerRoute('/settings', require('./routes/settingsRoute'));
registerRoute('/inventory', require('./routes/inventoryRoute'));
registerRoute('/parties', require('./routes/partyRoute'));
registerRoute('/wallets', require('./routes/walletRoute'));
registerRoute('/reports', require('./routes/reportsRoute'));
registerRoute('/expenses', require('./routes/expenseRoute'));
registerRoute('/devices', require('./routes/deviceRoute'));
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Sheba Technology-এর সার্ভার ${PORT} পোর্টে চলছে...`);
});
