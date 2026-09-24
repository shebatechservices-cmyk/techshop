const request = require('supertest');
const express = require('express');
const pool = require('../config/db');
const warehouseRoute = require('../routes/warehouseRoute');

const app = express();
app.use(express.json());
app.use('/api/warehouses', warehouseRoute);

const { ensureWarehousesTable } = require('../controllers/warehouseController');

describe('Centralized Warehouse Management System Integration', () => {
    let createdWarehouseId = null;

    beforeAll(async () => {
        await ensureWarehousesTable();
        // Clear any test warehouses from previous runs
        await pool.query("DELETE FROM warehouses WHERE name LIKE 'Test Warehouse%' OR name LIKE 'Updated Test Warehouse%'");
    });

    afterAll(async () => {
        await pool.query("DELETE FROM warehouses WHERE name LIKE 'Test Warehouse%' OR name LIKE 'Updated Test Warehouse%'");
        await pool.end();
    });

    test('1. GET /api/warehouses - should return list of warehouses with defaults initialized', async () => {
        const res = await request(app).get('/api/warehouses');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
        
        // At least one warehouse should have is_default true
        const defaultWh = res.body.data.find((w) => w.is_default);
        expect(defaultWh).toBeDefined();
    });

    test('2. POST /api/warehouses - should create a new custom warehouse', async () => {
        const newWarehouse = {
            name: `Test Warehouse Outlet ${Date.now()}`,
            code: `TEST-WH-${Math.floor(100 + Math.random() * 900)}`,
            location: 'Chattogram Commercial Zone',
            address: 'Agrabad C/A, Chattogram',
            contact_person: 'Md. Karim',
            phone: '01811223344',
            is_default: false,
            is_active: true
        };

        const res = await request(app)
            .post('/api/warehouses')
            .send(newWarehouse);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeDefined();
        expect(res.body.data.name).toBe(newWarehouse.name);
        expect(res.body.data.code).toBe(newWarehouse.code);
        expect(res.body.data.is_default).toBe(false);

        createdWarehouseId = res.body.data.id;
    });

    test('3. POST /api/warehouses - duplicate warehouse name should be rejected with 409', async () => {
        const duplicateWarehouse = {
            name: `Test Warehouse Outlet 99999`,
            code: 'TEST-WH-DUP',
            location: 'Dhaka',
            is_default: false
        };

        // Create first
        await request(app).post('/api/warehouses').send(duplicateWarehouse);

        // Try creating duplicate
        const res = await request(app).post('/api/warehouses').send(duplicateWarehouse);
        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
    });

    test('4. PUT /api/warehouses/:id - should update warehouse information', async () => {
        const updatePayload = {
            name: `Updated Test Warehouse ${Date.now()}`,
            code: 'TEST-WH-UPD',
            location: 'Sylhet Hub',
            address: 'Zindabazar, Sylhet',
            contact_person: 'Mr. Sylhet Manager',
            phone: '01799887766',
            is_active: true
        };

        const res = await request(app)
            .put(`/api/warehouses/${createdWarehouseId}`)
            .send(updatePayload);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe(updatePayload.name);
        expect(res.body.data.location).toBe('Sylhet Hub');
        expect(res.body.data.contact_person).toBe('Mr. Sylhet Manager');
    });

    test('5. PUT /api/warehouses/:id/default - should set warehouse as default and clear previous default', async () => {
        const res = await request(app)
            .put(`/api/warehouses/${createdWarehouseId}/default`)
            .send();

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.is_default).toBe(true);

        // Fetch all warehouses to verify exclusivity of default flag
        const listRes = await request(app).get('/api/warehouses');
        const defaultWarehouses = listRes.body.data.filter((w) => w.is_default);
        expect(defaultWarehouses.length).toBe(1);
        expect(defaultWarehouses[0].id).toBe(createdWarehouseId);
    });

    test('6. DELETE /api/warehouses/:id - cannot delete active default warehouse', async () => {
        const res = await request(app).delete(`/api/warehouses/${createdWarehouseId}`);
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toContain('Cannot delete the default warehouse');
    });

    test('7. DELETE /api/warehouses/:id - soft-delete non-default warehouse', async () => {
        // First set another warehouse as default
        const listRes = await request(app).get('/api/warehouses');
        const otherWh = listRes.body.data.find((w) => w.id !== createdWarehouseId);
        expect(otherWh).toBeDefined();

        await request(app).put(`/api/warehouses/${otherWh.id}/default`).send();

        // Now delete createdWarehouseId
        const delRes = await request(app).delete(`/api/warehouses/${createdWarehouseId}`);
        expect(delRes.status).toBe(200);
        expect(delRes.body.success).toBe(true);

        // Verify deleted warehouse is excluded from active list
        const activeRes = await request(app).get('/api/warehouses?active=true');
        expect(activeRes.body.data.some((w) => w.id === createdWarehouseId)).toBe(false);
    });
});
