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

describe('updateOrder payment & ledger sync', () => {
    it('updates Due purchase to Full Payment, deducts cash drawer balance, and adjusts supplier due in transaction', async () => {
        const freshDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours old
        const executedQueries = [];

        const client = setupClient({
            'SELECT \\* FROM purchase_orders WHERE id =': () => ({
                rows: [{
                    id: 10,
                    po_number: 'PO-DUE-01',
                    supplier_id: 5,
                    total_cost: '5000.00',
                    total_paid: '0.00',
                    total_due: '5000.00',
                    status: 'approved',
                    unit_count: 5,
                    created_at: freshDate,
                }],
            }),
            'SELECT.*FROM purchase_order_items': () => ({ rows: [] }),
            'SELECT.*FROM sales_items': () => ({ rows: [] }),
            'SELECT id, name FROM suppliers': () => ({
                rows: [{ id: 5, name: 'Acme Supplier' }],
            }),
            'SELECT \\* FROM purchase_order_payments': () => ({
                rows: [],
            }),
            'SELECT \\* FROM payment_accounts WHERE id =': () => ({
                rows: [{ id: 1, name: 'Cash Drawer', balance: '10000.00', account_type: 'drawer' }],
            }),
            'UPDATE purchase_orders': () => ({ rowCount: 1 }),
            'UPDATE suppliers': () => ({ rowCount: 1 }),
            'UPDATE payment_accounts': () => ({ rowCount: 1 }),
            'INSERT INTO purchase_order_payments': () => ({ rowCount: 1 }),
        });

        const originalQuery = client.query;
        client.query = jest.fn(async (text, params) => {
            executedQueries.push({ text, params });
            return originalQuery(text, params);
        });

        const wallet = require('../controllers/walletController');

        const req = {
            params: { id: '10' },
            body: {
                supplier_id: 5,
                items: [],
                payments: [
                    {
                        method: 'Cash',
                        account_id: 1,
                        sub_option: 'Cash Drawer',
                        amount: 5000,
                    },
                ],
            },
        };
        const res = mockRes();

        await purchase.updateOrder(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    total_paid: 5000,
                    total_due: 0,
                    status: 'PAID',
                }),
            })
        );

        // Transaction BEGIN and COMMIT check
        const hasBegin = executedQueries.some(q => /BEGIN/i.test(q.text));
        const hasCommit = executedQueries.some(q => /COMMIT/i.test(q.text));
        expect(hasBegin).toBe(true);
        expect(hasCommit).toBe(true);

        // Verify Cash Drawer balance was deducted
        const drawerDeduction = executedQueries.find(q =>
            /UPDATE payment_accounts SET balance = COALESCE\(balance, 0\) - \$1/i.test(q.text)
        );
        expect(drawerDeduction).toBeDefined();
        expect(drawerDeduction.params).toEqual([5000, 1]);

        // Verify Supplier payable_balance was reduced by 5000 (delta: -5000)
        const supplierUpdate = executedQueries.find(q =>
            /UPDATE suppliers/i.test(q.text) && /payable_balance = GREATEST\(0, COALESCE\(payable_balance, 0\) \+ \$1\)/i.test(q.text)
        );
        expect(supplierUpdate).toBeDefined();
        expect(supplierUpdate.params).toEqual([-5000, 5]);

        // Verify account transaction ledger was logged
        expect(wallet.logAccountTxn).toHaveBeenCalledWith(
            client,
            1,
            'purchase_payment',
            5000,
            'PO-DUE-01',
            expect.stringContaining('PO-DUE-01'),
            expect.objectContaining({
                sourceType: 'purchase',
                sourceId: 'PO-DUE-01',
                transactionType: 'debit',
            })
        );
    });

    it('reverses existing payments, refunds cash drawer balance, and restores supplier due when updating from Paid to Due', async () => {
        const freshDate = new Date(Date.now() - 1 * 60 * 60 * 1000);
        const executedQueries = [];

        const client = setupClient({
            'SELECT \\* FROM purchase_orders WHERE id =': () => ({
                rows: [{
                    id: 11,
                    po_number: 'PO-PAID-01',
                    supplier_id: 6,
                    total_cost: '3000.00',
                    total_paid: '3000.00',
                    total_due: '0.00',
                    status: 'PAID',
                    unit_count: 2,
                    created_at: freshDate,
                }],
            }),
            'SELECT.*FROM purchase_order_items': () => ({ rows: [] }),
            'SELECT.*FROM sales_items': () => ({ rows: [] }),
            'SELECT id, name FROM suppliers': () => ({
                rows: [{ id: 6, name: 'Supplier B' }],
            }),
            'SELECT \\* FROM purchase_order_payments': () => ({
                rows: [{
                    id: 101,
                    purchase_order_id: 11,
                    payment_method: 'Cash',
                    account_id: 1,
                    amount: '3000.00',
                    sub_option: 'Cash Drawer',
                }],
            }),
            'SELECT \\* FROM payment_accounts WHERE id =': () => ({
                rows: [{ id: 1, name: 'Cash Drawer', balance: '7000.00', account_type: 'drawer' }],
            }),
            'UPDATE purchase_orders': () => ({ rowCount: 1 }),
            'UPDATE suppliers': () => ({ rowCount: 1 }),
            'UPDATE payment_accounts': () => ({ rowCount: 1 }),
            'DELETE FROM purchase_order_payments': () => ({ rowCount: 1 }),
        });

        const originalQuery = client.query;
        client.query = jest.fn(async (text, params) => {
            executedQueries.push({ text, params });
            return originalQuery(text, params);
        });

        const wallet = require('../controllers/walletController');

        const req = {
            params: { id: '11' },
            body: {
                supplier_id: 6,
                items: [],
                payments: [], // Set to Due (0 payments)
            },
        };
        const res = mockRes();

        await purchase.updateOrder(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    total_paid: 0,
                    total_due: 3000,
                    status: 'approved',
                }),
            })
        );

        // Verify Cash Drawer balance was refunded (+3000)
        const drawerRefund = executedQueries.find(q =>
            /UPDATE payment_accounts SET balance = COALESCE\(balance, 0\) \+ \$1/i.test(q.text)
        );
        expect(drawerRefund).toBeDefined();
        expect(drawerRefund.params).toEqual([3000, 1]);

        // Verify Supplier payable_balance was increased by 3000 (delta: +3000)
        const supplierUpdate = executedQueries.find(q =>
            /UPDATE suppliers/i.test(q.text) && /payable_balance = GREATEST\(0, COALESCE\(payable_balance, 0\) \+ \$1\)/i.test(q.text)
        );
        expect(supplierUpdate).toBeDefined();
        expect(supplierUpdate.params).toEqual([3000, 6]);

        // Verify credit transaction logged for refund
        expect(wallet.logAccountTxn).toHaveBeenCalledWith(
            client,
            1,
            'deposit',
            3000,
            'PO-PAID-01',
            expect.stringContaining('PO-PAID-01'),
            expect.objectContaining({
                sourceType: 'purchase_refund',
                sourceId: 'PO-PAID-01',
                transactionType: 'credit',
            })
        );
    });
});


