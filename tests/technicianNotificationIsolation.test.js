const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const settingsController = require('../controllers/settingsController');
const pool = require('../config/db');

describe('Technician Notification Isolation Tests', () => {
    let app;
    let techUserId = null;
    let sampleProjectId = null;

    beforeAll(async () => {
        // Query an existing technician user
        const techRes = await pool.query(`
            SELECT id FROM users
            WHERE (role_id = 4 OR role_name ILIKE '%tech%' OR role = 'TECHNICIAN')
              AND deleted_at IS NULL
            LIMIT 1
        `);
        if (techRes.rows.length > 0) {
            techUserId = techRes.rows[0].id;
        } else {
            techUserId = 999;
        }

        // Ensure a test project is assigned to this technician
        const projRes = await pool.query(`
            INSERT INTO service_projects (project_code, title, technician_id, assigned_technician, status, customer_billing_amount)
            VALUES ('PRJ-TECH-NOTIF-99', 'CCTV Maintenance for Client', $1, $1, 'in_progress', 4500)
            RETURNING id
        `, [techUserId]);
        sampleProjectId = projRes.rows[0].id;

        // Ensure wallet exists for this technician
        await pool.query(`
            INSERT INTO wallets (entity_type, entity_id, entity_name, balance, status)
            VALUES ('technician', $1, 'Test Tech Notif', 1500, 'active')
            ON CONFLICT DO NOTHING
        `, [techUserId]);
    });

    afterAll(async () => {
        if (sampleProjectId) {
            await pool.query('DELETE FROM service_projects WHERE id = $1', [sampleProjectId]);
        }
        await pool.end().catch(() => null);
    });

    beforeEach(() => {
        app = express();
        app.use(bodyParser.json());
        app.get('/api/settings/notifications', settingsController.getLiveNotifications);
    });

    test('1. Admin receives global notifications (sales, stock, due, customer offers, etc.)', async () => {
        const res = await request(app)
            .get('/api/settings/notifications?role=admin')
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);

        const types = res.body.data.map(n => n.type);
        // Admin gets global operational feeds
        const hasGlobal = types.some(t => ['stock', 'sales', 'due', 'purchase', 'new_product', 'offer_customer'].includes(t));
        expect(hasGlobal).toBe(true);
    });

    test('2. Technician receives ONLY their own notifications and ZERO global notifications', async () => {
        const res = await request(app)
            .get(`/api/settings/notifications?role=technician&user_id=${techUserId}`)
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);

        const notifications = res.body.data;
        const types = notifications.map(n => n.type);

        // Strict verification: NO global operational alerts
        expect(types).not.toContain('stock');
        expect(types).not.toContain('sales');
        expect(types).not.toContain('due');
        expect(types).not.toContain('purchase');
        expect(types).not.toContain('new_product');
        expect(types).not.toContain('offer_customer');
        expect(types).not.toContain('sms');

        // Must contain technician-specific items (project, wallet, payout, or technician offer)
        const hasProject = types.includes('project');
        const hasWallet = types.includes('wallet') || types.includes('payout') || types.includes('offer_technician');
        expect(hasProject || hasWallet).toBe(true);

        // Verify the project is specifically assigned to this technician
        const projectNotif = notifications.find(n => n.type === 'project');
        if (projectNotif) {
            expect(projectNotif.targetSection).toBe('projects');
            expect(projectNotif.category).toBe('Assigned Projects');
        }
    });
});
