const request = require('supertest');
const express = require('express');
const pool = require('../config/db');

describe('Parent Tender in New Account Create & Wallet Sync', () => {
    let app;
    let createdTenderId;
    let createdAccountId;
    let createdTenderId2;
    const testId = Date.now();
    const accountName = `Test Tender Account ${testId}`;
    const updatedAccountName = `Test Tender Account Upd ${testId}`;

    const cleanup = async () => {
        await pool.query('DELETE FROM accounts WHERE account_name LIKE $1', ['Test Tender Account%']).catch(() => null);
        await pool.query('DELETE FROM payment_accounts WHERE name LIKE $1', ['Test Tender Account%']).catch(() => null);
        await pool.query('DELETE FROM tenders WHERE name LIKE $1', ['Test Tender%']).catch(() => null);
        await pool.query('DELETE FROM tenders WHERE name LIKE $1', ['Special MFS%']).catch(() => null);
        await pool.query('DELETE FROM tenders WHERE name LIKE $1', ['Secondary Tender%']).catch(() => null);
    };

    beforeAll(async () => {
        await cleanup();
        app = express();
        app.use(express.json());
        app.use('/api/accounts', require('../routes/accountRoute'));
    });

    afterAll(async () => {
        await cleanup();
        await pool.end().catch(() => null);
    });

    test('1. Creates a new Parent Tender', async () => {
        const res = await request(app)
            .post('/api/accounts/tenders')
            .send({ name: 'Special MFS ' + testId });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('id');
        createdTenderId = res.body.data.id;
    });

    test('2. Creates an Account Record linked to the Parent Tender', async () => {
        const res = await request(app)
            .post('/api/accounts/account-records')
            .send({
                tenderId: createdTenderId,
                accountName: accountName,
                location: 'Sylhet Branch',
                openingBalance: 1500,
                referenceId: 'REF-TEST-001',
                createdBy: 'Test Suite',
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.tender_id).toBe(createdTenderId);
        expect(res.body.data.tender_name).toBeDefined();
        createdAccountId = res.body.data.id;
    });

    test('3. GET /api/accounts/account-records returns tender_id and tender_name', async () => {
        const res = await request(app).get('/api/accounts/account-records');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const found = res.body.data.find((a) => a.id === createdAccountId);
        expect(found).toBeDefined();
        expect(found.tender_id).toBe(createdTenderId);
        expect(found.tender_name).toBeTruthy();
    });

    test('4. GET /api/accounts/wallets includes tender_id and tender_name', async () => {
        const res = await request(app).get('/api/accounts/wallets');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const found = res.body.data.find((w) => w.account_name === accountName);
        expect(found).toBeDefined();
        expect(Number(found.tender_id)).toBe(createdTenderId);
        expect(found.tender_name).toBeTruthy();
    });

    test('5. Updating account record updates tender_id', async () => {
        const tender2Res = await request(app)
            .post('/api/accounts/tenders')
            .send({ name: 'Secondary Tender ' + testId });
        createdTenderId2 = tender2Res.body.data.id;

        const updateRes = await request(app)
            .put(`/api/accounts/account-records/${createdAccountId}`)
            .send({
                tenderId: createdTenderId2,
                accountName: updatedAccountName,
                location: 'Sylhet Branch Main',
                openingBalance: 2000,
                currentBalance: 2000,
                referenceId: 'REF-TEST-002',
            });

        expect(updateRes.status).toBe(200);
        expect(updateRes.body.success).toBe(true);
        expect(updateRes.body.data.tender_id).toBe(createdTenderId2);
    });

    test('6. Updating wallet via /wallets/:id updates tender_id and syncs with accounts', async () => {
        const walletsRes = await request(app).get('/api/accounts/wallets');
        const found = walletsRes.body.data.find((w) => w.account_name === updatedAccountName);
        expect(found).toBeDefined();

        const updateWalletRes = await request(app)
            .put(`/api/accounts/wallets/${found.id}`)
            .send({
                name: updatedAccountName,
                account_type: 'bank',
                account_number: '01700000000',
                tender_id: createdTenderId,
            });

        expect(updateWalletRes.status).toBe(200);
        expect(updateWalletRes.body.success).toBe(true);

        // Verify it synced back to accounts
        const accountsRes = await request(app).get('/api/accounts/account-records');
        const foundAccount = accountsRes.body.data.find((a) => a.id === createdAccountId);
        expect(foundAccount.tender_id).toBe(createdTenderId);
    });
});
