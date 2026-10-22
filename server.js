require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { authLimiter, otpLimiter, corsOptions } = require('./config/corsConfig');
const { checkLicenseKillSwitch } = require('./middlewares/licenseMiddleware');
const { apiAuthGate } = require('./middlewares/apiAuthGate');
const { registerApiRoutes } = require('./routes/apiRoutes');

const app = express();

// Handle Chrome Private Network Access preflights
app.use((req, res, next) => {
    if (req.headers['access-control-request-private-network']) {
        res.setHeader('Access-Control-Allow-Private-Network', 'true');
    }
    next();
});

app.use(cors(corsOptions));
app.use(express.json());

app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

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

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff')
}));

app.get('/api', (req, res) => {
    res.json({ message: 'Sheba Technology API is running', version: '16.9.26' });
});

// Tighten rate limits on credential-based public endpoints
app.use('/api/security/login', authLimiter);
app.use('/api/security/signup', authLimiter);
app.use('/api/security/recovery-request', otpLimiter);

// Global License Kill Switch & Auth Gate for API requests
app.use('/api', checkLicenseKillSwitch);
app.use('/api', apiAuthGate);

// Register API routes
registerApiRoutes(app);

// Serve frontend static assets in production if built
const distPath = path.join(__dirname, 'frontend/dist');
if (fs.existsSync(distPath)) {
    app.get('/sw.js', (req, res) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.sendFile(path.join(distPath, 'sw.js'));
    });
    app.use(express.static(distPath));
}

// Dedicated Android APK download route
app.get(['/sheba-pos.apk', '/download-apk', '/api/download-apk', '/uploads/apk/sheba-pos.apk'], (req, res) => {
    const candidates = [
        path.join(__dirname, 'uploads', 'apk', 'sheba-pos.apk'),
        path.join(__dirname, 'frontend', 'dist', 'sheba-pos.apk'),
        path.join(__dirname, 'frontend', 'public', 'sheba-pos.apk'),
        path.join(__dirname, 'sheba-pos.apk'),
    ];
    for (const p of candidates) {
        if (fs.existsSync(p)) {
            res.setHeader('Content-Disposition', 'attachment; filename="sheba-pos.apk"');
            res.setHeader('Content-Type', 'application/vnd.android.package-archive');
            return res.sendFile(p);
        }
    }
    return res.status(404).json({ success: false, message: 'APK file not found on server' });
});

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
    // If request explicitly expects JSON, is an XHR call, or has auth token, NEVER return index.html!
    const wantsJson =
        req.headers.accept?.includes('application/json') ||
        req.headers['x-requested-with'] === 'XMLHttpRequest' ||
        Boolean(req.headers.authorization) ||
        req.path.startsWith('/api') ||
        req.originalUrl.startsWith('/api');

    if (wantsJson) {
        return res.status(404).json({
            success: false,
            error: 'API endpoint not found',
            path: req.originalUrl
        });
    }

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
