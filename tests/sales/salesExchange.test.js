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

describe('createExchangeSale', () => {
    test('happy path: creates exchange invoice, restocks returned items and commits', async () => {
        const client = setupClient({
            'INSERT INTO sales [(]': () => ({ rows: [{ id: 88, invoice_no: 'INV-EXC-20260101-1001' }] }),
            'INSERT INTO sales_items': () => ({ rows: [{ id: 950 }] }),
            'FROM payment_accounts': () => ({ rows: [{ id: 1 }] }),
        });

        const body = {
            original_sale_id: 77,
            original_invoice_no: 'INV-20250101-1001',
            customer_id: 10,
            returned_items: [
                { product_id: 5, name: 'Old Cam', quantity: 1, unit_price: 500, condition: 'Good', reason: 'Upgrade' }
            ],
            new_items: [
                { product_id: 12, quantity: 1, unit_price: 800, cost_price: 600, serials: [] }
            ],
            paid_amount: 300,
        };

        const res = mockRes();
        await sales.createExchangeSale({ body }, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            invoice_no: expect.stringContaining('INV-EXC'),
            net_difference: 300,
        }));
        expect(client.query).toHaveBeenCalledWith('COMMIT');
    });

    test('serial-missing on new replacement item returns 400 and rolls back', async () => {
        const client = setupClient({
            'FROM products': () => ({ rows: [{ id: 15, name: 'Replacement Cam', stock: 10, is_serial_tracked: true, is_bundle: false }] }),
        });

        const body = {
            original_sale_id: 77,
            original_invoice_no: 'INV-20250101-1001',
            customer_id: 10,
            returned_items: [
                { product_id: 5, name: 'Old Cam', quantity: 1, unit_price: 500 }
            ],
            new_items: [
                { product_id: 15, quantity: 1, unit_price: 800, serials: [] }
            ],
        };

        const res = mockRes();
        await sales.createExchangeSale({ body }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: expect.stringContaining('serial-tracked'),
        }));
        expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    });

    test('pure return / refund: saves exchange invoice with payment_status = refunded', async () => {
        let insertedPaymentStatus = null;
        const client = setupClient({
            'INSERT INTO sales [(]': (_text, params) => {
                insertedPaymentStatus = params[10];
                return { rows: [{ id: 89, invoice_no: 'INV-EXC-20260101-1002', payment_status: insertedPaymentStatus }] };
            },
            'FROM payment_accounts': () => ({ rows: [{ id: 1 }] }),
            'SELECT \\* FROM sales WHERE id =': () => ({
                rows: [{ id: 77, total_amount: 1000, paid_amount: 1000, due_amount: 0 }],
            }),
        });

        const body = {
            original_sale_id: 77,
            original_invoice_no: 'INV-20250101-1001',
            customer_id: 10,
            returned_items: [
                { product_id: 5, name: 'Old Cam', quantity: 1, unit_price: 500, condition: 'Good' }
            ],
            new_items: [],
            paid_amount: 500,
        };

        const res = mockRes();
        await sales.createExchangeSale({ body }, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(insertedPaymentStatus).toBe('refunded');
        expect(client.query).toHaveBeenCalledWith('COMMIT');
    });
});
