// Tests for purchaseController serial checking, duplicate validation, and graceful deletion
jest.mock('../config/db', () => {
    const { createPoolMock } = require('./mocks/poolMock');
    return createPoolMock();
});

jest.mock('../controllers/walletController', () => ({
    ensureWalletSchema: jest.fn(),
    writeWalletLedger: jest.fn(),
    logAccountTxn: jest.fn(),
}));

const pool = require('../config/db');
const purchase = require('../controllers/purchaseController');

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
    const client = {
        query: jest.fn(runQuery),
        release: jest.fn(),
    };
    pool.connect.mockResolvedValue(client);
    return client;
};

beforeEach(() => {
    pool.connect.mockReset();
    pool.query.mockReset();
    pool.query.mockResolvedValue({ rows: [], rowCount: 0 });
});

describe('checkSerial', () => {
    it('returns exists: true when serial exists in database', async () => {
        pool.query.mockImplementation((text, params) => {
            if (/SELECT\s+pos\.serial_code/i.test(text)) {
                return Promise.resolve({
                    rows: [{
                        serial_code: 'SN-1001',
                        purchase_order_id: 1,
                        po_number: 'PO-TEST01',
                        product_name: 'Test Product',
                        supplier_name: 'Supplier A',
                    }],
                    rowCount: 1,
                });
            }
            return Promise.resolve({ rows: [], rowCount: 0 });
        });

        const req = { query: { serial: 'SN-1001' } };
        const res = mockRes();

        await purchase.checkSerial(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                exists: true,
                message: expect.stringContaining('already exists in Inventory'),
            })
        );
    });

    it('returns exists: false when serial is unique and available', async () => {
        pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

        const req = { query: { serial: 'SN-UNIQUE-999' } };
        const res = mockRes();

        await purchase.checkSerial(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                exists: false,
                message: 'Serial/Barcode is available',
            })
        );
    });
});

describe('createOrder serial duplicate prevention', () => {
    it('rejects intra-payload duplicate serials', async () => {
        const client = setupClient({
            'SELECT id, name FROM suppliers': () => ({
                rows: [{ id: 1, name: 'Main Supplier' }],
            }),
        });

        const req = {
            body: {
                supplier_id: 1,
                items: [
                    {
                        product_id: 10,
                        quantity: 2,
                        cost_price: 100,
                        sale_price: 150,
                        expected_date: '2026-09-17',
                        serials: ['SN-DUP-01', 'SN-DUP-01'],
                    },
                ],
            },
        };
        const res = mockRes();

        await purchase.createOrder(req, res);

        expect(client.query).toHaveBeenCalledWith('ROLLBACK');
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: expect.stringContaining('Duplicate serial/barcode "SN-DUP-01"'),
            })
        );
    });

    it('rejects serials that already exist in database', async () => {
        const client = setupClient({
            'SELECT id, name FROM suppliers': () => ({
                rows: [{ id: 1, name: 'Main Supplier' }],
            }),
            'SELECT pos\\.serial_code': () => ({
                rows: [
                    {
                        serial_code: 'SN-ALREADY-EXISTS',
                        po_number: 'PO-OLD-01',
                        product_name: 'Existing Product',
                    },
                ],
            }),
        });

        const req = {
            body: {
                supplier_id: 1,
                items: [
                    {
                        product_id: 10,
                        quantity: 1,
                        cost_price: 100,
                        sale_price: 150,
                        expected_date: '2026-09-17',
                        serials: ['SN-ALREADY-EXISTS'],
                    },
                ],
            },
        };
        const res = mockRes();

        await purchase.createOrder(req, res);

        expect(client.query).toHaveBeenCalledWith('ROLLBACK');
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: expect.stringContaining('already exist in Inventory'),
            })
        );
    });
});

describe('deleteOrder referral integrity & 7-day time lock', () => {
    it('blocks deletion when purchase is older than 7 days (168 hours)', async () => {
        const oldDate = new Date(Date.now() - 170 * 60 * 60 * 1000); // 170 hours old
        pool.query.mockImplementation((text) => {
            if (/SELECT\s+\*\s+FROM\s+purchase_orders\s+WHERE\s+id\s*=/i.test(text)) {
                return Promise.resolve({
                    rows: [{ id: 1, po_number: 'PO-OLD-7D', created_at: oldDate }],
                    rowCount: 1,
                });
            }
            return Promise.resolve({ rows: [], rowCount: 0 });
        });

        const req = { params: { id: '1' } };
        const res = mockRes();

        await purchase.deleteOrder(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: 'Delete window (7 days) has expired. Please use the Return/Exchange module instead.',
            })
        );
    });

    it('aborts deletion and returns specific invoice numbers when items are linked to existing sales', async () => {
        const freshDate = new Date(Date.now() - 5 * 60 * 60 * 1000); // 5 hours old
        pool.query.mockImplementation((text) => {
            if (/SELECT\s+\*\s+FROM\s+purchase_orders\s+WHERE\s+id\s*=/i.test(text)) {
                return Promise.resolve({
                    rows: [{ id: 1, po_number: 'PO-LINKED', created_at: freshDate, supplier_id: 1 }],
                    rowCount: 1,
                });
            }
            if (/SELECT\s+DISTINCT\s+s\.invoice_no\s+FROM\s+sales_item_serials/i.test(text)) {
                return Promise.resolve({
                    rows: [{ invoice_no: 'INV-20260916-1001' }, { invoice_no: 'INV-20260916-1002' }],
                    rowCount: 2,
                });
            }
            return Promise.resolve({ rows: [], rowCount: 0 });
        });

        const req = { params: { id: '1' } };
        const res = mockRes();

        await purchase.deleteOrder(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: expect.stringContaining('Please delete or rollback Sale Invoices [Invoice #INV-20260916-1001], [Invoice #INV-20260916-1002] first.'),
                linked_invoices: ['INV-20260916-1001', 'INV-20260916-1002'],
            })
        );
    });
});

describe('updateOrder 15-day time lock', () => {
    it('blocks editing when purchase order is older than 15 days (360 hours)', async () => {
        const oldDate = new Date(Date.now() - 361 * 60 * 60 * 1000); // 361 hours old
        setupClient({
            'SELECT \\* FROM purchase_orders WHERE id =': () => ({
                rows: [{ id: 1, po_number: 'PO-OLD-15D', created_at: oldDate }],
            }),
        });

        const req = { params: { id: '1' }, body: { items: [] } };
        const res = mockRes();

        await purchase.updateOrder(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: expect.stringContaining('Edits are only permitted within 15 days'),
            })
        );
    });
});

