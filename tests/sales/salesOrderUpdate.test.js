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
const { mockRes, setupClient: rawSetupClient, validSaleBody } = require('./salesTestHelpers');

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

describe('updateSale', () => {
    const existingSale = () => ({
        id: 77, invoice_no: 'INV-20250101-1001', customer_id: 10,
        subtotal: 1000, due_amount: 0, paid_amount: 1000,
        loyalty_points_used: 0, loyalty_points_earned: 10,
        payment_details: JSON.stringify([{ method: 'cash', amount: 1000 }]),
        created_at: new Date(),
        extra_cost_category: null, extra_cost_notes: null,
        sales_person: null, destination: null, attention: null,
        invoice_date: null, notes: '',
    });

    test('happy path: reverses old items, re-inserts, commits and returns 200', async () => {
        const client = setupClient({
            'SELECT \\* FROM sales WHERE': () => ({ rows: [existingSale()] }),
            'SELECT \\* FROM sales_items WHERE': () => ({ rows: [{ product_id: 5, quantity: 2, sales_item_id: 1 }] }),
            'SELECT id, is_serial_tracked': () => ({ rows: [{ id: 5, is_serial_tracked: false }] }),
            'FROM payment_accounts': () => ({ rows: [{ id: 1 }] }),
            'UPDATE sales SET': () => ({ rows: [{ id: 77 }] }),
        });
        const res = mockRes();
        await sales.updateSale(
            { params: { id: 77 }, body: { ...validSaleBody() } },
            res
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        expect(client.query).toHaveBeenCalledWith('COMMIT');
        expect(client.query).toHaveBeenCalledWith('DELETE FROM sales_items WHERE sale_id = $1', [77]);
    });

    test('rejects edits older than 15 days (360 hours)', async () => {
        setupClient({
            'SELECT \\* FROM sales WHERE': () => ({ rows: [{ ...existingSale(), created_at: new Date(Date.now() - 361 * 3600 * 1000) }] }),
        });
        const res = mockRes();
        await sales.updateSale({ params: { id: 77 }, body: validSaleBody() }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: expect.stringContaining('15 days'),
        }));
    });

    test('allows edits older than 15 days when valid admin_pin is provided', async () => {
        const client = setupClient({
            'SELECT \\* FROM sales WHERE': () => ({ rows: [{ ...existingSale(), created_at: new Date(Date.now() - 361 * 3600 * 1000) }] }),
            'SELECT \\* FROM sales_items WHERE': () => ({ rows: [{ product_id: 5, quantity: 2 }] }),
            'SELECT id, is_serial_tracked': () => ({ rows: [{ id: 5, is_serial_tracked: false }] }),
            'FROM payment_accounts': () => ({ rows: [{ id: 1 }] }),
            'SELECT allow_invoice_modification': () => ({ rows: [{ allow_invoice_modification: true, invoice_edit_time_limit_hours: 360, security_pin: '1234' }] }),
            'UPDATE sales SET': () => ({ rows: [{ id: 77, invoice_no: 'INV-20250101-1001' }] }),
            'INSERT INTO sales_items': () => ({ rows: [{ id: 901 }] }),
        });
        const res = mockRes();
        await sales.updateSale(
            { params: { id: 77 }, body: { ...validSaleBody(), admin_pin: '1234' } },
            res
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        expect(client.query).toHaveBeenCalledWith('COMMIT');
    });

    test('rejects edits when allow_invoice_modification is false without valid admin_pin', async () => {
        setupClient({
            'SELECT \\* FROM sales WHERE': () => ({ rows: [existingSale()] }),
            'SELECT allow_invoice_modification': () => ({ rows: [{ allow_invoice_modification: false, invoice_edit_time_limit_hours: 360, security_pin: '1234' }] }),
        });
        const res = mockRes();
        await sales.updateSale({ params: { id: 77 }, body: validSaleBody() }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: expect.stringContaining('disabled by administrative policy'),
        }));
    });

    test('wallet-insufficient failure returns 500 with rollback', async () => {
        const client = setupClient({
            'SELECT \\* FROM sales WHERE': () => ({ rows: [existingSale()] }),
            'SELECT \\* FROM sales_items WHERE': () => ({ rows: [{ product_id: 5, quantity: 2 }] }),
            'SELECT id, is_serial_tracked': () => ({ rows: [{ id: 5, is_serial_tracked: false }] }),
            'SELECT loyalty_points': () => ({ rows: [{ loyalty_points: 0 }] }),
            'SELECT wallet_balance': () => ({ rows: [{ wallet_balance: 5 }] }),
            'FROM payment_accounts': () => ({ rows: [{ id: 1 }] }),
        });
        const res = mockRes();
        await sales.updateSale(
            { params: { id: 77 }, body: { ...validSaleBody(), payment_details: [{ method: 'wallet', amount: 99999 }] } },
            res
        );

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: expect.stringContaining('insufficient balance'),
        }));
        expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    });

    test('serial-missing failure returns 400 and rolls back', async () => {
        const client = setupClient({
            'SELECT \\* FROM sales WHERE': () => ({ rows: [existingSale()] }),
            'SELECT \\* FROM sales_items WHERE': () => ({ rows: [{ product_id: 5, quantity: 2 }] }),
            'FROM products': () => ({ rows: [{ id: 5, name: 'Tracked Product', stock: 10, is_serial_tracked: true, is_bundle: false }] }),
        });
        const res = mockRes();
        await sales.updateSale(
            { params: { id: 77 }, body: { ...validSaleBody(), items: [{ product_id: 5, quantity: 1, unit_price: 500 }] } },
            res
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: expect.stringMatching(/serial.*tracked/),
        }));
        expect(client.query).toHaveBeenCalledWith('ROLLBACK');
        expect(client.query).not.toHaveBeenCalledWith('COMMIT');
    });
});
