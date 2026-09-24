// Unit tests for RBAC protection on PUT /api/settings/update

jest.mock('../config/db', () => {
    const { createPoolMock } = require('./mocks/poolMock');
    return createPoolMock();
});

const pool = require('../config/db');
const settings = require('../controllers/settingsController');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const setupClient = (handlers = {}) => {
    const runQuery = (text, params) => {
        for (const [pattern, handler] of Object.entries(handlers)) {
            if (new RegExp(pattern).test(text)) {
                return Promise.resolve(handler(text, params));
            }
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
    };
    pool.query.mockImplementation(runQuery);
};

beforeEach(() => {
    pool.query.mockReset();
    pool.query.mockImplementation((text) => {
        if (/ALTER TABLE|CREATE TABLE/.test(text)) return Promise.resolve({ rows: [] });
        return Promise.resolve({ rows: [], rowCount: 0 });
    });
});

describe('Settings Controller RBAC: updateSettings', () => {
    test('rejects non-admin cashier trying to modify allow_invoice_modification (403 Forbidden)', async () => {
        const req = {
            body: { allow_invoice_modification: false },
            user: { id: 5, name: 'Cashier John', role_id: 3, role_name: 'Staff' },
            headers: {},
        };
        const res = mockRes();

        await settings.updateSettings(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: expect.stringContaining('Only users with the Admin or Super Admin role'),
        }));
    });

    test('rejects non-admin staff trying to modify invoice_edit_time_limit_hours (403 Forbidden)', async () => {
        const req = {
            body: { invoice_edit_time_limit_hours: 48 },
            user: { id: 6, name: 'Staff Jane', role_id: 4, role_name: 'Cashier' },
            headers: {},
        };
        const res = mockRes();

        await settings.updateSettings(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: expect.stringContaining('Only users with the Admin or Super Admin role'),
        }));
    });

    test('allows Admin (role_id: 2) to modify allow_invoice_modification and invoice_edit_time_limit_hours (200 OK)', async () => {
        setupClient({
            'UPDATE shop_settings SET': () => ({
                rows: [{ id: 1, allow_invoice_modification: false, invoice_edit_time_limit_hours: 48 }],
            }),
        });

        const req = {
            body: { allow_invoice_modification: false, invoice_edit_time_limit_hours: 48 },
            user: { id: 2, name: 'Admin Boss', role_id: 2, role_name: 'Admin' },
            headers: {},
        };
        const res = mockRes();

        await settings.updateSettings(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: expect.objectContaining({
                allow_invoice_modification: false,
                invoice_edit_time_limit_hours: 48,
            }),
        }));
    });

    test('allows Super Admin (role_id: 1) to modify security_pin, allow_invoice_modification (200 OK)', async () => {
        setupClient({
            'UPDATE shop_settings SET': () => ({
                rows: [{ id: 1, security_pin: '5678', allow_invoice_modification: true }],
            }),
        });

        const req = {
            body: { security_pin: '5678', allow_invoice_modification: true },
            user: { id: 1, name: 'Super Admin', role_id: 1, role_name: 'Super Admin' },
            headers: {},
        };
        const res = mockRes();

        await settings.updateSettings(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
        }));
    });
});
