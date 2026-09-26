const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const settingsController = require('../controllers/settingsController');

describe('Database Cleanup Production Environment Guard', () => {
    let app;
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
        app = express();
        app.use(bodyParser.json());
        // Mock authenticated user
        app.use((req, res, next) => {
            req.user = { id: 1, role_id: 1, role_name: 'Super Admin' };
            next();
        });
        app.post('/api/settings/clean-dummy-data', settingsController.cleanDummyData);
    });

    afterEach(() => {
        process.env.NODE_ENV = originalEnv;
    });

    test('1. POST /api/settings/clean-dummy-data is strictly rejected with 403 in production', async () => {
        process.env.NODE_ENV = 'production';

        const res = await request(app)
            .post('/api/settings/clean-dummy-data')
            .send({
                confirmationText: 'CLEAR-DUMMY-DATA',
                backupFirst: false,
                scope: 'transactions'
            });

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('প্রোডাকশন পরিবেশে');
    });

    test('2. POST /api/settings/clean-dummy-data requires confirmation phrase in development', async () => {
        process.env.NODE_ENV = 'development';

        const res = await request(app)
            .post('/api/settings/clean-dummy-data')
            .send({
                confirmationText: 'WRONG_PHRASE'
            });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });
});
