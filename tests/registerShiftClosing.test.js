const request = require('supertest');
const express = require('express');
const pool = require('../config/db');

describe('End-of-Day (EOD) / Cash Register Shift Closing & Blind Close Integration Tests', () => {
    let app;
    let testShiftId;

    beforeAll(async () => {
        app = express();
        app.use(express.json());
        // Mock authenticated user session
        app.use((req, res, next) => {
            req.user = { id: 217, name: 'Sheba Technology Admin', role: 'admin' };
            next();
        });
        app.use('/api/register', require('../routes/registerRoute'));

        // Ensure any active shifts are cleaned or closed for a clean test suite
        await pool.query("UPDATE register_shifts SET status = 'closed', is_locked = true WHERE status = 'open'");
    });

    afterAll(async () => {
        // Clean up test shifts created during this test
        if (testShiftId) {
            await pool.query('DELETE FROM register_shifts WHERE id = $1', [testShiftId]).catch(() => {});
        }
        await pool.end().catch(() => {});
    });

    test('1. GET /api/register/current-shift should indicate no active shift initially', async () => {
        const res = await request(app).get('/api/register/current-shift');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.has_active_shift).toBe(false);
    });

    test('2. POST /api/register/open should successfully open a new register shift', async () => {
        const res = await request(app)
            .post('/api/register/open')
            .send({
                opening_balance: 1000,
                notes: 'Morning Cash Drawer Opening'
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.shift).toBeDefined();
        expect(Number(res.body.shift.opening_balance)).toBe(1000);
        expect(res.body.shift.status).toBe('open');
        expect(res.body.shift.is_locked).toBe(false);

        testShiftId = res.body.shift.id;
    });

    test('3. POST /api/register/open should reject opening another shift when one is already active', async () => {
        const res = await request(app)
            .post('/api/register/open')
            .send({
                opening_balance: 500,
                notes: 'Duplicate attempt'
            });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('ইতিমধ্যে চালু আছে');
    });

    test('4. GET /api/register/current-shift should return the active shift details', async () => {
        const res = await request(app).get('/api/register/current-shift');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.has_active_shift).toBe(true);
        expect(res.body.shift.id).toBe(testShiftId);
        expect(res.body.shift.live_metrics).toBeDefined();
        expect(res.body.shift.live_metrics.opening_balance).toBe(1000);
    });

    test('5. POST /api/register/close (Blind Close) with perfect match should set status to closed', async () => {
        // Blind Close submission: expected is 1000 (no sales yet), cashier enters 1000
        const res = await request(app)
            .post('/api/register/close')
            .send({
                actual_cash_counted: 1000,
                denominations: { 1000: 1 },
                notes: 'End of shift handover - balanced'
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.shift.status).toBe('closed');
        expect(res.body.shift.is_locked).toBe(true);
        expect(Number(res.body.shift.variance_amount)).toBe(0);
        expect(Number(res.body.shift.expected_cash_balance)).toBe(1000);
        expect(Number(res.body.shift.actual_cash_counted)).toBe(1000);
    });

    test('6. POST /api/register/open & close with Shortage should calculate negative variance and mark discrepancy', async () => {
        // Open a new shift
        const openRes = await request(app)
            .post('/api/register/open')
            .send({
                opening_balance: 2000,
                notes: 'Afternoon Shift'
            });
        expect(openRes.status).toBe(201);
        const shift2Id = openRes.body.shift.id;

        // Cashier counts 1850 (Shortage of 150)
        const closeRes = await request(app)
            .post('/api/register/close')
            .send({
                actual_cash_counted: 1850,
                denominations: { 1000: 1, 500: 1, 200: 1, 100: 1, 50: 1 },
                notes: 'Discrepancy test'
            });

        expect(closeRes.status).toBe(200);
        expect(closeRes.body.shift.status).toBe('discrepancy');
        expect(Number(closeRes.body.shift.variance_amount)).toBe(-150);
        expect(closeRes.body.shift.is_locked).toBe(true);

        // Clean up
        await pool.query('DELETE FROM register_shifts WHERE id = $1', [shift2Id]);
    });

    test('7. GET /api/register/shifts should return paginated shift history', async () => {
        const res = await request(app).get('/api/register/shifts?limit=10');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.shifts)).toBe(true);
        expect(res.body.total).toBeGreaterThanOrEqual(1);
    });

    test('8. GET /api/register/shifts/:id should return single shift details with transactions', async () => {
        const res = await request(app).get(`/api/register/shifts/${testShiftId}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.shift.id).toBe(testShiftId);
        expect(Array.isArray(res.body.sales)).toBe(true);
        expect(Array.isArray(res.body.expenses)).toBe(true);
    });
});
