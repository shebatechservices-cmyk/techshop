const request = require('supertest');
const express = require('express');
const pool = require('../config/db');

describe('Payment Methods Centralized Database-Driven System', () => {
    let app;
    let createdMethodId;

    beforeAll(async () => {
        app = express();
        app.use(express.json());
        app.use('/api/accounts', require('../routes/accountRoute'));
        app.use('/api/settings', require('../routes/settingsRoute'));
        app.use('/api/sales', require('../routes/salesRoute'));
        app.use('/api/purchases', require('../routes/purchaseRoute'));
    });

    afterAll(async () => {
        // Clean up any test payment methods created during the test
        if (createdMethodId) {
            await pool.query('DELETE FROM payment_methods WHERE id = $1', [createdMethodId]).catch(() => null);
        }
        await pool.end().catch(() => null);
    });

    test('GET /api/accounts/payment-methods returns all active/default payment methods', async () => {
        const res = await request(app).get('/api/accounts/payment-methods');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);

        const names = res.body.data.map((m) => m.name || m.method_name);
        expect(names).toContain('Cash');
        expect(names).toContain('bKash');
    });

    test('POST /api/accounts/payment-methods creates a new centralized payment method', async () => {
        const newMethod = {
            name: 'Upay MFS Test',
            type: 'mobile_banking',
            account_number: '01711223344',
            account_details: 'Upay Merchant Account',
            is_active: true,
        };
        const res = await request(app)
            .post('/api/accounts/payment-methods')
            .send(newMethod);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body.data).toHaveProperty('id');
        expect(res.body.data.name).toBe('Upay MFS Test');
        expect(res.body.data.type).toBe('mobile_banking');
        expect(res.body.data.account_number).toBe('01711223344');
        expect(res.body.data.is_active).toBe(true);

        createdMethodId = res.body.data.id;
    });

    test('PUT /api/accounts/payment-methods/:id updates payment method details', async () => {
        expect(createdMethodId).toBeDefined();

        const updateData = {
            name: 'Upay Commercial',
            type: 'mobile_banking',
            account_number: '01999887766',
            account_details: 'Updated Upay Corporate Merchant Wallet',
        };
        const res = await request(app)
            .put(`/api/accounts/payment-methods/${createdMethodId}`)
            .send(updateData);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body.data.name).toBe('Upay Commercial');
        expect(res.body.data.account_number).toBe('01999887766');
    });

    test('PUT /api/accounts/payment-methods/:id/toggle toggles active state', async () => {
        expect(createdMethodId).toBeDefined();

        // Toggle from active (true) to inactive (false)
        const toggleOff = await request(app)
            .put(`/api/accounts/payment-methods/${createdMethodId}/toggle`);
        expect(toggleOff.status).toBe(200);
        expect(toggleOff.body.data.is_active).toBe(false);

        // Verify active_only filter excludes it
        const activeRes = await request(app).get('/api/accounts/payment-methods?active_only=true');
        expect(activeRes.status).toBe(200);
        const activeIds = activeRes.body.data.map((m) => m.id);
        expect(activeIds).not.toContain(createdMethodId);

        // Toggle back to active (true)
        const toggleOn = await request(app)
            .put(`/api/accounts/payment-methods/${createdMethodId}/toggle`);
        expect(toggleOn.status).toBe(200);
        expect(toggleOn.body.data.is_active).toBe(true);
    });

    test('DELETE /api/accounts/payment-methods/:id performs soft-deactivation preserving transaction history', async () => {
        expect(createdMethodId).toBeDefined();

        const res = await request(app)
            .delete(`/api/accounts/payment-methods/${createdMethodId}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('success', true);

        // Verify DB row has deleted_at set and is_active = false
        const dbCheck = await pool.query('SELECT * FROM payment_methods WHERE id = $1', [createdMethodId]);
        expect(dbCheck.rows.length).toBe(1);
        expect(dbCheck.rows[0].deleted_at).not.toBeNull();
        expect(dbCheck.rows[0].is_active).toBe(false);

        // GET should no longer list the soft-deleted method
        const listRes = await request(app).get('/api/accounts/payment-methods');
        const listIds = listRes.body.data.map((m) => m.id);
        expect(listIds).not.toContain(createdMethodId);
    });

    test('GET /api/settings/payment-methods route alias works symmetrically', async () => {
        const res = await request(app).get('/api/settings/payment-methods?active_only=true');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.every((m) => m.is_active === true)).toBe(true);
    });
});
