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

    it('DELETE /api/brands/:id cleans up created test brand', async () => {
        if (!createdBrandId) return;
        const res = await request(app).delete(`/api/brands/${createdBrandId}`);
        expect([200, 204]).toContain(res.status);
    });
});
