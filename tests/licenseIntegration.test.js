const request = require('supertest');
const express = require('express');

describe('License & Vendor Integration Module', () => {
    jest.setTimeout(20000);
    let app;
    const licenseController = require('../controllers/licenseController');
    const { checkLicenseKillSwitch, resetLicenseCache } = require('../middlewares/licenseMiddleware');

    beforeAll(() => {
        app = express();
        app.use(express.json());

        // Attach kill switch
        app.use('/api', checkLicenseKillSwitch);

        // License routes
        app.use('/api/license', require('../routes/licenseRoute'));

        // Protected test route
        app.get('/api/protected/test', (req, res) => {
            res.json({ success: true, message: 'Access granted' });
        });
    });

    afterAll(async () => {
        const pool = require('../config/db');
        const prisma = require('../config/prisma');
        await prisma.$disconnect().catch(() => null);
        await pool.end().catch(() => null);
    });

    beforeEach(() => {
        resetLicenseCache();
    });

    test('GET /api/license/status returns license metrics and client app id', async () => {
        const res = await request(app).get('/api/license/status');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('client_app_id');
        expect(res.body).toHaveProperty('vendor_api_url');
        expect(res.body).toHaveProperty('hardware_id');
        expect(res.body).toHaveProperty('status');
    });

    test('POST /api/license/redeem rejects empty or short codes', async () => {
        const res = await request(app)
            .post('/api/license/redeem')
            .send({ code: '' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('POST /api/license/redeem strictly rejects fake/tampered codes with 400', async () => {
        const res = await request(app)
            .post('/api/license/redeem')
            .send({ code: 'FAKE-TAMPERED-CODE-9999' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Invalid Code');
    });

    test('POST /api/license/redeem redeems valid code and updates local database', async () => {
        // Create an active test code in Vendor DB
        const { PrismaClient } = require('/home/sheba/Vendor/node_modules/@prisma/client');
        const vendorPrisma = new PrismaClient({
            datasources: { db: { url: 'file:/home/sheba/Vendor/prisma/dev.db' } }
        });
        const testCode = 'TEST-JEST-LIC-' + Date.now();
        await vendorPrisma.licenseCode.create({
            data: {
                code: testCode,
                category: 'APP_LICENSE',
                validityType: 'YEARS_1',
                validityYears: 1,
                status: 'AVAILABLE',
            }
        });
        await vendorPrisma.$disconnect();

        const res = await request(app)
            .post('/api/license/redeem')
            .send({ code: testCode });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.status).toBe('active');
        expect(res.body.data.license_expiry).toBeDefined();
        expect(res.body.data.vendor_verified).toBe(true);

        // Submitting same code again must fail with 400 'Code already used'
        const reRes = await request(app)
            .post('/api/license/redeem')
            .send({ code: testCode });
        expect(reRes.status).toBe(400);
        expect(reRes.body.error).toBe('Code already used');
    });

    test('POST /api/license/heartbeat synchronizes handshake with vendor', async () => {
        const res = await request(app)
            .post('/api/license/heartbeat')
            .send({});
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test('Middleware blocks protected routes when license is suspended and allows redemption', async () => {
        const pool = require('../config/db');
        // Create an active unblock code in Vendor DB
        const { PrismaClient } = require('/home/sheba/Vendor/node_modules/@prisma/client');
        const vendorPrisma = new PrismaClient({
            datasources: { db: { url: 'file:/home/sheba/Vendor/prisma/dev.db' } }
        });
        const unblockCode = 'TEST-UNBLOCK-' + Date.now();
        await vendorPrisma.licenseCode.create({
            data: {
                code: unblockCode,
                category: 'APP_LICENSE',
                validityType: 'YEARS_1',
                validityYears: 1,
                status: 'AVAILABLE',
            }
        });
        await vendorPrisma.$disconnect();

        // Simulate suspended state
        await pool.query("UPDATE vendor_license_cache SET status = 'suspended'");
        resetLicenseCache();

        // Protected route should be blocked with 403 LICENSE_BLOCKED
        const blockedRes = await request(app).get('/api/protected/test');
        expect(blockedRes.status).toBe(403);
        expect(blockedRes.body).toHaveProperty('code', 'LICENSE_BLOCKED');

        // /api/license/redeem remains accessible
        const redeemRes = await request(app)
            .post('/api/license/redeem')
            .send({ code: unblockCode });
        expect(redeemRes.status).toBe(200);
        expect(redeemRes.body.success).toBe(true);

        // After redemption, protected route is unblocked
        resetLicenseCache();
        const unblockedRes = await request(app).get('/api/protected/test');
        expect(unblockedRes.status).toBe(200);
        expect(unblockedRes.body.success).toBe(true);
    });
});
