jest.mock('../../config/db', () => {
    const { createPoolMock } = require('../mocks/poolMock');
    return createPoolMock();
});

jest.mock('../../controllers/walletController', () => ({
    ensureWalletSchema: jest.fn(),
    writeWalletLedger: jest.fn(),
    drawerLedgerOnly: jest.fn(),
}));

const pool = require('../../config/db');
const { ensureWalletSchema, writeWalletLedger, drawerLedgerOnly } = require('../../controllers/walletController');
const sales = require('../../controllers/salesController');
const { mockRes, setupClient: rawSetupClient } = require('./salesTestHelpers');

const setupClient = (handlers = {}) => rawSetupClient(pool, handlers);

beforeEach(() => {
    pool.connect.mockReset();
    pool.query.mockReset();
    pool.query.mockResolvedValue({ rows: [], rowCount: 0 });
    ensureWalletSchema.mockReset();
    writeWalletLedger.mockReset();
    drawerLedgerOnly.mockReset();
    pool.query.mockImplementation((text) => {
        if (/ALTER TABLE/.test(text)) return Promise.resolve({ rows: [] });
        if (/nextval/.test(text)) return Promise.resolve({ rows: [{ seq: 1001 }] });
        return Promise.resolve({ rows: [], rowCount: 0 });
    });
});

describe('deleteSale', () => {
    const deletableSale = () => ({
        id: 77, invoice_no: 'INV-20250101-1001', customer_id: 10,
        created_at: new Date(), due_amount: 0,
        loyalty_points_used: 0, loyalty_points_earned: 0,
        payment_details: JSON.stringify([{ method: 'cash', amount: 500 }]),
    });

    test('happy path: reverses stock/drawer, soft-deletes and moves to trash', async () => {
        const client = setupClient({
            'SELECT \\* FROM sales WHERE': () => ({ rows: [deletableSale()] }),
            'SELECT 1 FROM warranty_claims': () => ({ rows: [] }),
            'SELECT 1 FROM product_returns': () => ({ rows: [] }),
            'SELECT 1 FROM service_projects': () => ({ rows: [] }),
            'SELECT \\* FROM sales_items WHERE': () => ({ rows: [{ product_id: 5, quantity: 2 }] }),
            'FROM payment_accounts': () => ({ rows: [{ id: 1 }] }),
            'INSERT INTO trash_records': () => ({ rows: [] }),
        });
        const res = mockRes();
        await sales.deleteSale({ params: { id: 77 } }, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        expect(client.query).toHaveBeenCalledWith('UPDATE sales SET deleted_at = NOW() WHERE id = $1', [77]);
        expect(client.query).toHaveBeenCalledWith('COMMIT');
        expect(writeWalletLedger).not.toHaveBeenCalled();
    });

    test('blocks deletion beyond the 7-day window', async () => {
        const client = setupClient({
            'SELECT \\* FROM sales WHERE': () => ({ rows: [{ ...deletableSale(), created_at: new Date(Date.now() - 170 * 3600 * 1000) }] }),
        });
        const res = mockRes();
        await sales.deleteSale({ params: { id: 77 } }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: expect.stringContaining('7 days'),
        }));
        expect(client.query).not.toHaveBeenCalledWith('COMMIT');
    });

    test('allows deletion beyond 7 days when valid admin_pin is provided', async () => {
        const client = setupClient({
            'SELECT \\* FROM sales WHERE': () => ({
                rows: [{ ...deletableSale(), created_at: new Date(Date.now() - 8 * 24 * 3600 * 1000) }],
            }),
            'SELECT security_pin FROM shop_settings': () => ({ rows: [{ security_pin: '1234' }] }),
            'SELECT 1 FROM warranty_claims': () => ({ rows: [] }),
            'SELECT 1 FROM product_returns': () => ({ rows: [] }),
            'SELECT 1 FROM service_projects': () => ({ rows: [] }),
            'SELECT \\* FROM sales_items WHERE': () => ({ rows: [{ product_id: 5, quantity: 2 }] }),
            'UPDATE customers SET receivable_balance': () => ({ rows: [] }),
            'FROM payment_accounts': () => ({ rows: [{ id: 1 }] }),
            'INSERT INTO trash_records': () => ({ rows: [] }),
        });
        const res = mockRes();
        await sales.deleteSale({ params: { id: 77 }, body: { admin_pin: '1234' } }, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        expect(client.query).toHaveBeenCalledWith('COMMIT');
    });

    test('blocks deletion beyond 7 days when incorrect admin_pin is provided', async () => {
        const client = setupClient({
            'SELECT \\* FROM sales WHERE': () => ({
                rows: [{ ...deletableSale(), created_at: new Date(Date.now() - 8 * 24 * 3600 * 1000) }],
            }),
            'SELECT security_pin FROM shop_settings': () => ({ rows: [{ security_pin: '1234' }] }),
        });
        const res = mockRes();
        await sales.deleteSale({ params: { id: 77 }, body: { admin_pin: 'wrong_pin' } }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: expect.stringContaining('7 days'),
        }));
        expect(client.query).not.toHaveBeenCalledWith('COMMIT');
    });

    test('strictly blocks deletion when warranty claims exist even with valid admin_pin', async () => {
        const client = setupClient({
            'SELECT \\* FROM sales WHERE': () => ({ rows: [deletableSale()] }),
            'SELECT security_pin FROM shop_settings': () => ({ rows: [{ security_pin: '1234' }] }),
            'SELECT 1 FROM warranty_claims': () => ({ rows: [{ '?column?': 1 }] }),
        });
        const res = mockRes();
        await sales.deleteSale({ params: { id: 77 }, body: { admin_pin: '1234' } }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: expect.stringContaining('warranty claims'),
        }));
        expect(client.query).not.toHaveBeenCalledWith('COMMIT');
    });

    test('returns 404 when the sale does not exist', async () => {
        setupClient({
            'SELECT \\* FROM sales WHERE': () => ({ rows: [] }),
        });
        const res = mockRes();
        await sales.deleteSale({ params: { id: 999 } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });
});
