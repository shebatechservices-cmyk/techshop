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

describe('createSale', () => {
    test('happy path: inserts sale, items and serials, returns 201', async () => {
        const client = setupClient({
            'INSERT INTO sales [(]': () => ({ rows: [{ id: 77, invoice_no: 'INV-20250101-1001' }] }),
            'INSERT INTO sales_items': () => ({ rows: [{ id: 900 }] }),
            'FROM payment_accounts': () => ({ rows: [{ id: 1 }] }),
        });
        const res = mockRes();
        await sales.createSale({ body: validSaleBody() }, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        expect(client.query).toHaveBeenCalledWith('COMMIT');
        expect(drawerLedgerOnly).not.toHaveBeenCalled();
    });

    test('serial-missing failure: tracked product without serial returns 400 and rolls back', async () => {
        const client = setupClient({
            'FROM products': () => ({ rows: [{ id: 5, name: 'Tracked Product', stock: 10, is_serial_tracked: true, is_bundle: false }] }),
        });
        const body = validSaleBody();
        body.items = [{ product_id: 5, quantity: 1, unit_price: 500, serials: [] }];
        const res = mockRes();
        await sales.createSale({ body }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: expect.stringMatching(/serial.*tracked/),
        }));
        expect(client.query).toHaveBeenCalledWith('ROLLBACK');
        expect(client.query).not.toHaveBeenCalledWith('COMMIT');
    });

    test('wallet-insufficient failure: throws, rolls back and returns 500', async () => {
        setupClient({
            'INSERT INTO sales [(]': () => ({ rows: [{ id: 78 }] }),
            'SELECT wallet_balance': () => ({ rows: [{ wallet_balance: 10 }] }),
            'FROM payment_accounts': () => ({ rows: [{ id: 1 }] }),
        });
        const body = validSaleBody();
        body.payment_details = [{ method: 'wallet', amount: 99999 }];
        const res = mockRes();
        await sales.createSale({ body }, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: expect.stringContaining('insufficient balance'),
        }));
    });

    test('out-of-stock failure: ordering quantity exceeding stock returns 400 and rolls back', async () => {
        const client = setupClient({
            'FROM products': () => ({
                rows: [{ id: 5, name: 'Test Cam', stock: 1, is_serial_tracked: false, is_bundle: false }],
            }),
        });
        const body = validSaleBody();
        body.items = [{ product_id: 5, quantity: 5, unit_price: 500 }];
        const res = mockRes();
        await sales.createSale({ body }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: expect.stringContaining('Insufficient stock'),
        }));
        expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    });

    test('phantom serial failure: non-existent serial returns 400 and rolls back', async () => {
        const client = setupClient({
            'FROM products': () => ({
                rows: [{ id: 5, name: 'Tracked Cam', stock: 5, is_serial_tracked: true, is_bundle: false }],
            }),
            'purchase_order_serials': () => ({
                rows: [],
            }),
        });
        const body = validSaleBody();
        body.items = [{ product_id: 5, quantity: 1, unit_price: 500, serials: ['PHANTOM-99'] }];
        const res = mockRes();
        await sales.createSale({ body }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: expect.stringContaining('does not exist in inventory'),
        }));
        expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    });

    test('already sold serial failure: serial sold previously returns 400 and rolls back', async () => {
        const client = setupClient({
            'FROM products': () => ({
                rows: [{ id: 5, name: 'Tracked Cam', stock: 5, is_serial_tracked: true, is_bundle: false }],
            }),
            'purchase_order_serials': () => ({
                rows: [{ id: 1, serial_code: 'SN-100' }],
            }),
            'sales_item_serials': () => ({
                rows: [{ invoice_no: 'INV-OLD-01', sale_id: 10 }],
            }),
        });
        const body = validSaleBody();
        body.items = [{ product_id: 5, quantity: 1, unit_price: 500, serials: ['SN-100'] }];
        const res = mockRes();
        await sales.createSale({ body }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: expect.stringContaining('has already been sold in Invoice #INV-OLD-01'),
        }));
        expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    });
});
