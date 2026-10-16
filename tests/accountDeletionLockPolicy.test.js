const request = require('supertest');
const express = require('express');
const pool = require('../config/db');

describe('Strict Account Deletion Lock Policy', () => {
    let app;
    const testId = Date.now();
    const cleanAccountName = `Test Clean Acc ${testId}`;
    const lockedAccountName = `Test Locked Acc ${testId}`;
    let cleanAccountId;
    let lockedAccountId;

    const cleanup = async () => {
        if (cleanAccountId) {
            await pool.query('DELETE FROM account_transactions WHERE account_id = $1', [cleanAccountId]).catch(() => null);
            await pool.query('DELETE FROM payment_accounts WHERE id = $1', [cleanAccountId]).catch(() => null);
        }
        if (lockedAccountId) {
            await pool.query('DELETE FROM account_transactions WHERE account_id = $1', [lockedAccountId]).catch(() => null);
            await pool.query('DELETE FROM payment_accounts WHERE id = $1', [lockedAccountId]).catch(() => null);
        }
        await pool.query('DELETE FROM payment_accounts WHERE name LIKE $1', ['Test % Acc %']).catch(() => null);
        await pool.query('DELETE FROM accounts WHERE account_name LIKE $1', ['Test % Acc %']).catch(() => null);
    };

    beforeAll(async () => {
        await cleanup();
        app = express();
        app.use(express.json());
        app.use('/api/accounts', require('../routes/accountRoute'));

        // 1. Create a clean account (0 balance, 0 transactions)
        const cleanRes = await pool.query(
            "INSERT INTO payment_accounts (name, account_type, balance, is_active) VALUES ($1, 'bank', 0, true) RETURNING id",
            [cleanAccountName]
        );
        cleanAccountId = cleanRes.rows[0].id;

        // 2. Create an account with a transaction entry
        const lockedRes = await pool.query(
            "INSERT INTO payment_accounts (name, account_type, balance, is_active) VALUES ($1, 'bank', 0, true) RETURNING id",
            [lockedAccountName]
        );
        lockedAccountId = lockedRes.rows[0].id;

        await pool.query(
            "INSERT INTO account_transactions (account_id, type, amount, balance_after, note, created_at) VALUES ($1, 'deposit', 500, 500, 'Test deposit', NOW())",
            [lockedAccountId]
        );
    });

    afterAll(async () => {
        await cleanup();
        await pool.end().catch(() => null);
    });

    it('strictly blocks deletion of account with transaction history', async () => {
        const res = await request(app)
            .delete(`/api/accounts/wallets/${lockedAccountId}`);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.is_locked).toBe(true);
        expect(res.body.message).toMatch(/transactions are recorded under this account/i);
    });

    it('strictly blocks deletion even when force=true is requested', async () => {
        const res = await request(app)
            .delete(`/api/accounts/wallets/${lockedAccountId}?force=true`);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.is_locked).toBe(true);
        expect(res.body.message).toMatch(/Financial records cannot be deleted/i);

        // Verify transactions are NOT deleted
        const txCheck = await pool.query('SELECT COUNT(*) FROM account_transactions WHERE account_id = $1', [lockedAccountId]);
        expect(parseInt(txCheck.rows[0].count, 10)).toBeGreaterThan(0);
    });

    it('permits deletion of clean account with zero transactions and zero balance', async () => {
        const res = await request(app)
            .delete(`/api/accounts/wallets/${cleanAccountId}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toMatch(/deleted successfully/i);

        // Verify account is removed
        const accCheck = await pool.query('SELECT * FROM payment_accounts WHERE id = $1', [cleanAccountId]);
        expect(accCheck.rows.length).toBe(0);
    });
});
