const request = require('supertest');
const express = require('express');
const pool = require('../config/db');

describe('SMS Gateway Providers & Automated Triggers Integration Tests', () => {
    let app;
    let createdProviderId;

    beforeAll(async () => {
        app = express();
        app.use(express.json());
        // Mock user session for requireRole middleware
        app.use((req, res, next) => {
            req.user = { id: 1, role_id: 1, role_name: 'Super Admin' };
            next();
        });
        app.use('/api/settings', require('../routes/settingsRoute'));
    });

    afterAll(async () => {
        // Clean up test provider
        if (createdProviderId) {
            await pool.query('DELETE FROM sms_providers WHERE id = $1', [createdProviderId]).catch(() => {});
        }
        await pool.end().catch(() => {});
    });

    test('1. GET /api/settings/sms/providers should return default gateway providers', async () => {
        const res = await request(app).get('/api/settings/sms/providers');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThanOrEqual(1);

        const greenweb = res.body.data.find(p => p.provider_code === 'greenweb');
        expect(greenweb).toBeDefined();
    });

    test('2. POST /api/settings/sms/providers should create a new gateway provider', async () => {
        const payload = {
            provider_name: 'Test Custom Gateway',
            provider_code: 'test_custom',
            api_url: 'https://example.com/api/sms/send',
            http_method: 'POST',
            auth_type: 'bearer',
            api_key: 'test_token_12345',
            sender_id: 'SHEBATEST',
            param_phone_key: 'to',
            param_message_key: 'msg',
            is_active: false
        };

        const res = await request(app)
            .post('/api/settings/sms/providers')
            .send(payload);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.provider_name).toBe('Test Custom Gateway');
        createdProviderId = res.body.data.id;
    });

    test('3. PUT /api/settings/sms/providers/:id should update provider configuration', async () => {
        const res = await request(app)
            .put(`/api/settings/sms/providers/${createdProviderId}`)
            .send({
                sender_id: 'SHEBAUPDATED',
                param_message_key: 'text_body'
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.sender_id).toBe('SHEBAUPDATED');
        expect(res.body.data.param_message_key).toBe('text_body');
    });

    test('4. PUT /api/settings/sms/providers/:id/activate should switch active gateway', async () => {
        const res = await request(app)
            .put(`/api/settings/sms/providers/${createdProviderId}/activate`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const activeProv = res.body.data.find(p => p.id === createdProviderId);
        expect(activeProv.is_active).toBe(true);
    });

    test('5. GET /api/settings/sms/triggers should return all 11 automated triggers', async () => {
        const res = await request(app).get('/api/settings/sms/triggers');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThanOrEqual(11);

        const saleTrigger = res.body.data.find(t => t.trigger_key === 'sale_confirm');
        expect(saleTrigger).toBeDefined();
        expect(saleTrigger.template_bn).toContain('{customer_name}');
    });

    test('6. PUT /api/settings/sms/triggers should update trigger template and status', async () => {
        const res = await request(app)
            .put('/api/settings/sms/triggers')
            .send({
                triggers: [
                    {
                        trigger_key: 'sale_confirm',
                        is_enabled: true,
                        template_bn: 'ধন্যবাদ {customer_name}! আপনার মেমো #{invoice_no} পরিশোধিত। - {shop_name}'
                    }
                ]
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        const updated = res.body.data.find(t => t.trigger_key === 'sale_confirm');
        expect(updated.template_bn).toContain('মেমো #{invoice_no}');
    });

    test('7. POST /api/settings/sms/test should record log in sms_logs table', async () => {
        const res = await request(app)
            .post('/api/settings/sms/test')
            .send({
                phone: '01700112233',
                message: 'Test message unit verification'
            });

        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.body.delivery).toBeDefined();
        expect(res.body.delivery.recipient).toBe('01700112233');

        // Verify entry in sms_logs
        const logRes = await pool.query("SELECT * FROM sms_logs WHERE recipient_phone = '01700112233' ORDER BY created_at DESC LIMIT 1");
        expect(logRes.rows.length).toBe(1);
        expect(logRes.rows[0].message_content).toContain('Test message unit verification');
    });

    test('8. GET /api/settings/sms/logs should retrieve real audit history', async () => {
        const res = await request(app).get('/api/settings/sms/logs');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    test('9. DELETE /api/settings/sms/providers/:id should remove custom provider', async () => {
        const res = await request(app)
            .delete(`/api/settings/sms/providers/${createdProviderId}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        createdProviderId = null;
    });
});
