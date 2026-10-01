const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

const pool = require('../config/db');

const masterRouter = require('../routes/masterRoute');
const createEntityRouter = require('../routes/entityRouteFactory');

const app = express();
app.use(bodyParser.json());
app.use('/api/master', masterRouter);
app.use('/api/brands', createEntityRouter('brands'));
app.use('/api/series', createEntityRouter('series'));

describe('Master Brand Entity Endpoints', () => {
    afterAll(async () => {
        try {
            await pool.query("DELETE FROM product_names WHERE name LIKE 'Item-For-A-%' OR name LIKE 'Test-%'");
            await pool.query("DELETE FROM brands WHERE name LIKE 'Test-Master-%' OR name LIKE 'Brand-A-%' OR name LIKE 'Brand-B-%' OR name LIKE 'Test-Brand-%'");
            await pool.query("DELETE FROM trash_records WHERE record_title ~* 'Test-' OR record_title ~* 'Brand-A' OR record_title ~* 'Brand-B' OR record_title ~* 'Item-For-A'");
            await pool.end();
        } catch (e) {
            // ignore
        }
    });

    const testBrandName = `Test-Brand-${Date.now()}`;
    let createdBrandId;

    it('POST /api/brands creates a new brand and returns correct format', async () => {
        const res = await request(app)
            .post('/api/brands')
            .send({ name: testBrandName });

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Successfully added!');
        expect(res.body.data).toBeDefined();
        expect(res.body.data.name).toBe(testBrandName);
        createdBrandId = res.body.data.id;
    });

    it('GET /api/brands retrieves the created brand', async () => {
        const res = await request(app).get('/api/brands');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        const match = res.body.find((b) => b.id === createdBrandId);
        expect(match).toBeDefined();
        expect(match.name).toBe(testBrandName);
    });

    let altBrandId;

    it('POST /api/master/brands also creates a brand via master router', async () => {
        const altBrandName = `Test-Master-${Date.now()}`;
        const res = await request(app)
            .post('/api/master/brands')
            .send({ name: altBrandName });

        expect(res.status).toBe(201);
        expect(res.body.data.name).toBe(altBrandName);
        altBrandId = res.body.data.id;
    });

    it('GET /api/master/product_names strictly isolates items by brand_id', async () => {
        const brandA = `Brand-A-${Date.now()}`;
        const brandB = `Brand-B-${Date.now()}`;
        
        const resA = await request(app).post('/api/brands').send({ name: brandA });
        const resB = await request(app).post('/api/brands').send({ name: brandB });
        
        const brandAId = resA.body.data.id;
        const brandBId = resB.body.data.id;

        // Add a product name for brand A
        const itemRes = await request(app).post('/api/master/product_names').send({
            name: `Item-For-A-${Date.now()}`,
            brand_id: brandAId
        });
        const itemId = itemRes.body?.data?.id;

        // Query product_names for Brand B - must be EMPTY!
        const queryResB = await request(app).get(`/api/master/product_names?brand_id=${brandBId}`);
        expect(queryResB.status).toBe(200);
        expect(queryResB.body).toEqual([]);

        // Query product_names for Brand A - must contain Brand A item
        const queryResA = await request(app).get(`/api/master/product_names?brand_id=${brandAId}`);
        expect(queryResA.status).toBe(200);
        expect(queryResA.body.length).toBe(1);
        expect(queryResA.body[0].brand_id).toBe(brandAId);

        // Cleanup: remove child item first, then brands
        if (itemId) {
            await request(app).delete(`/api/master/product_names/${itemId}`);
        }
        await request(app).delete(`/api/brands/${brandAId}`);
        await request(app).delete(`/api/brands/${brandBId}`);
    });

    it('POST /api/series gracefully reuses existing series for the same brand instead of throwing duplicate error', async () => {
        const brandRes = await request(app).post('/api/brands').send({ name: `Brand-Series-${Date.now()}` });
        const brandId = brandRes.body.data.id;

        const seriesName = `Series-Test-${Date.now()}`;
        const firstRes = await request(app).post('/api/series').send({
            name: seriesName,
            brand_id: brandId,
            model_id: 1,
        });

        expect(firstRes.status).toBe(201);
        expect(firstRes.body.data).toBeDefined();
        const firstId = firstRes.body.data.id;

        // Attempt to create the same series again for the same brand with different model_id
        const secondRes = await request(app).post('/api/series').send({
            name: seriesName,
            brand_id: brandId,
            model_id: 2,
        });

        expect(secondRes.status).toBe(201);
        expect(secondRes.body.data.id).toBe(firstId);

        // Cleanup
        await pool.query('DELETE FROM series WHERE id = $1', [firstId]);
        await request(app).delete(`/api/brands/${brandId}`);
    });

    it('DELETE /api/brands/:id cleans up created test brand', async () => {
        if (createdBrandId) {
            const res = await request(app).delete(`/api/brands/${createdBrandId}`);
            expect([200, 204]).toContain(res.status);
        }
        if (altBrandId) {
            await request(app).delete(`/api/brands/${altBrandId}`);
        }
    });
});

