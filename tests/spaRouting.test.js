const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs');

describe('React SPA Catch-All & Strict API Prefix Routing', () => {
    let app;

    beforeAll(() => {
        app = express();
        app.use(express.json());

        // Dummy API router mounted on /api/products
        const productRouter = express.Router();
        productRouter.get('/', (req, res) => {
            res.json({ success: true, data: [{ id: 1, name: 'SMART HOME CAMERA' }] });
        });
        app.use('/api/products', productRouter);

        // Static assets simulation
        const distPath = path.join(__dirname, '../frontend/dist');
        if (fs.existsSync(distPath)) {
            app.use(express.static(distPath));
        }

        // 404 handler for unmatched /api requests (returns JSON, never HTML)
        app.use('/api', (req, res) => {
            res.status(404).json({
                success: false,
                error: 'API endpoint not found',
                path: req.originalUrl
            });
        });

        // Catch-all route to serve the React SPA index.html for all non-API navigation requests
        app.use((req, res, next) => {
            if (req.method === 'GET') {
                const indexPath = path.join(__dirname, '../frontend/dist/index.html');
                if (fs.existsSync(indexPath)) {
                    return res.sendFile(indexPath);
                }
                return res.status(404).send('Frontend build not found.');
            }
            next();
        });
    });

    test('1. GET /products (hard refresh) serves index.html, NOT raw JSON', async () => {
        const res = await request(app).get('/products');
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(/text\/html/);
        expect(res.text).toContain('<html');
        expect(res.text).toContain('root');
    });

    test('2. GET /sales (hard refresh) serves index.html', async () => {
        const res = await request(app).get('/sales');
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(/text\/html/);
        expect(res.text).toContain('<html');
    });

    test('3. GET /api/products returns raw JSON, not HTML', async () => {
        const res = await request(app).get('/api/products');
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(/application\/json/);
        expect(res.body.success).toBe(true);
        expect(res.body.data[0].name).toBe('SMART HOME CAMERA');
    });

    test('4. GET /api/non-existent-route returns JSON 404, never HTML', async () => {
        const res = await request(app).get('/api/non-existent-route');
        expect(res.status).toBe(404);
        expect(res.headers['content-type']).toMatch(/application\/json/);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('API endpoint not found');
    });
});
