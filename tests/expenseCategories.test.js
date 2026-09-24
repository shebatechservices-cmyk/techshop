const request = require('supertest');
const express = require('express');
const pool = require('../config/db');
const expenseCategoryRoute = require('../routes/expenseCategoryRoute');
const { ensureExpenseCategoriesTable } = require('../controllers/expenseCategoryController');

const app = express();
app.use(express.json());
app.use('/api/expense-categories', expenseCategoryRoute);

describe('Expense Categories Dynamic API & Management Integration', () => {
    const testCategoryName = `Test Supplies ${Date.now()}`;
    let createdCategoryId = null;
    let linkedCategoryId = null;
    let createdExpenseId = null;

    beforeAll(async () => {
        await ensureExpenseCategoriesTable();
        // Clear any old test data
        await pool.query("DELETE FROM expenses WHERE note LIKE 'Test Expense for Category%'");
        await pool.query("DELETE FROM expense_categories WHERE name LIKE 'Test Supplies%' OR name LIKE 'Renamed Supplies%' OR name LIKE 'InUse Category%'");
    });

    afterAll(async () => {
        if (createdExpenseId) {
            await pool.query('DELETE FROM expenses WHERE id = $1', [createdExpenseId]).catch(() => null);
        }
        await pool.query("DELETE FROM expenses WHERE note LIKE 'Test Expense for Category%'").catch(() => null);
        await pool.query("DELETE FROM expense_categories WHERE name LIKE 'Test Supplies%' OR name LIKE 'Renamed Supplies%' OR name LIKE 'InUse Category%'").catch(() => null);
        await pool.end().catch(() => null);
    });

    test('1. GET /api/expense-categories - should return categories with id, name, created_at', async () => {
        const res = await request(app).get('/api/expense-categories');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);

        const sample = res.body.data[0];
        expect(sample).toHaveProperty('id');
        expect(sample).toHaveProperty('name');
        expect(sample).toHaveProperty('created_at');
    });

    test('2. GET /api/expense-categories?format=array - supports raw array format', async () => {
        const res = await request(app).get('/api/expense-categories?format=array');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0]).toHaveProperty('name');
    });

    test('3. POST /api/expense-categories - should add a new category and return 201', async () => {
        const res = await request(app)
            .post('/api/expense-categories')
            .send({ name: testCategoryName });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeDefined();
        expect(res.body.data.name).toBe(testCategoryName);
        expect(res.body.data.id).toBeDefined();
        expect(res.body.data.created_at).toBeDefined();
        createdCategoryId = res.body.data.id;
    });

    test('4. POST /api/expense-categories - should reject empty name with 400', async () => {
        const res = await request(app)
            .post('/api/expense-categories')
            .send({ name: '   ' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('5. POST /api/expense-categories - handles duplicate category name gracefully', async () => {
        const res = await request(app)
            .post('/api/expense-categories')
            .send({ name: testCategoryName });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe(testCategoryName);
    });

    test('6. PUT /api/expense-categories/:id - renames an existing category', async () => {
        const updatedName = `Renamed Supplies ${Date.now()}`;
        const res = await request(app)
            .put(`/api/expense-categories/${createdCategoryId}`)
            .send({ name: updatedName });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe(updatedName);
    });

    test('7. PUT /api/expense-categories/:id - rejects empty name with 400', async () => {
        const res = await request(app)
            .put(`/api/expense-categories/${createdCategoryId}`)
            .send({ name: '' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('8. DELETE /api/expense-categories/:id - CRITICAL: blocks deletion with 400 if category is in use', async () => {
        // Create an in-use category
        const inUseName = `InUse Category ${Date.now()}`;
        const catRes = await request(app)
            .post('/api/expense-categories')
            .send({ name: inUseName });
        linkedCategoryId = catRes.body.data.id;

        // Insert an expense referencing this category
        const expRes = await pool.query(`
            INSERT INTO expenses (category_id, category_name, amount, note)
            VALUES ($1, $2, 100, 'Test Expense for Category Safety Check')
            RETURNING id;
        `, [linkedCategoryId, inUseName]);
        createdExpenseId = expRes.rows[0].id;

        // Attempt to delete the in-use category
        const delRes = await request(app).delete(`/api/expense-categories/${linkedCategoryId}`);

        expect(delRes.status).toBe(400);
        expect(delRes.body.success).toBe(false);
        expect(delRes.body.message).toBe('Cannot delete category: Existing expense records are using it');
    });

    test('9. DELETE /api/expense-categories/:id - deletes category successfully when not in use', async () => {
        const res = await request(app).delete(`/api/expense-categories/${createdCategoryId}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.deletedId).toBe(createdCategoryId);

        // Verify it was removed from database
        const check = await pool.query('SELECT id FROM expense_categories WHERE id = $1', [createdCategoryId]);
        expect(check.rows.length).toBe(0);
    });
});
