const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

const masterRouter = require('../routes/masterRoute');
const createEntityRouter = require('../routes/entityRouteFactory');

const app = express();
app.use(bodyParser.json());
app.use('/api/master', masterRouter);
app.use('/api/brands', createEntityRouter('brands'));

describe('Master Brand Entity Endpoints', () => {
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

    it('POST /api/master/brands also creates a brand via master router', async () => {
        const altBrandName = `Test-Master-${Date.now()}`;
        const res = await request(app)
            .post('/api/master/brands')
            .send({ name: altBrandName });

        expect(res.status).toBe(201);
        expect(res.body.data.name).toBe(altBrandName);
    });

    it('GET /api/master/product_names strictly isolates items by brand_id', async () => {
        const brandA = `Brand-A-${Date.now()}`;
        const brandB = `Brand-B-${Date.now()}`;
        
        const resA = await request(app).post('/api/brands').send({ name: brandA });
        const resB = await request(app).post('/api/brands').send({ name: brandB });
        
        const brandAId = resA.body.data.id;
        const brandBId = resB.body.data.id;

        // Add a product name for brand A
        await request(app).post('/api/master/product_names').send({
            name: `Item-For-A-${Date.now()}`,
            brand_id: brandAId
        });

        // Query product_names for Brand B - must be EMPTY!
        const queryResB = await request(app).get(`/api/master/product_names?brand_id=${brandBId}`);
        expect(queryResB.status).toBe(200);
        expect(queryResB.body).toEqual([]);

        // Query product_names for Brand A - must contain Brand A item
        const queryResA = await request(app).get(`/api/master/product_names?brand_id=${brandAId}`);
        expect(queryResA.status).toBe(200);
        expect(queryResA.body.length).toBe(1);
        expect(queryResA.body[0].brand_id).toBe(brandAId);

        // Cleanup
        await request(app).delete(`/api/brands/${brandAId}`);
        await request(app).delete(`/api/brands/${brandBId}`);
    });

    it('DELETE /api/brands/:id cleans up created test brand', async () => {
        if (!createdBrandId) return;
        const res = await request(app).delete(`/api/brands/${createdBrandId}`);
        expect([200, 204]).toContain(res.status);
    });
});
