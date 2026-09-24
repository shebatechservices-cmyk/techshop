// Tests for salesController (createSale / updateSale / deleteSale).
// The database pool and wallet helpers are mocked so the suite runs without a
// live test database; query calls are asserted against recorded invocations.

jest.mock('../config/db', () => {
    const { createPoolMock } = require('./mocks/poolMock');
    return createPoolMock();
});

jest.mock('../controllers/walletController', () => ({
    ensureWalletSchema: jest.fn(),
    writeWalletLedger: jest.fn(),
    drawerLedgerOnly: jest.fn(),
}));

const pool = require('../config/db');
const { ensureWalletSchema, writeWalletLedger, drawerLedgerOnly } = require('../controllers/walletController');
const sales = require('../controllers/salesController');

// --- tiny express-like response stub -------------------------------------
const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

// Build a pool mock where client.query dispatches per SQL pattern.
const setupClient = (handlers = {}) => {
    const runQuery = (text, params) => {
        if (/nextval/.test(text)) return Promise.resolve({ rows: [{ seq: 1001 }] });
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
    ensureWalletSchema.mockReset();
    writeWalletLedger.mockReset();
    drawerLedgerOnly.mockReset();
    // Keep runtime migration silent (module-level cache resets per test file).
    pool.query.mockImplementation((text) => {
        if (/ALTER TABLE/.test(text)) return Promise.resolve({ rows: [] });
        if (/nextval/.test(text)) return Promise.resolve({ rows: [{ seq: 1001 }] });
        return Promise.resolve({ rows: [], rowCount: 0 });
    });
});

const validSaleBody = () => ({
    customer_id: 10,
    items: [{ product_id: 5, quantity: 2, unit_price: 500, cost_price: 400 }],
    discount: 100,
    vat: 50,
    paid_amount: 1000,
    payment_method_id: 1,
    payment_details: [],
});

describe('createSale', () => {
    test('happy path: inserts sale, items and serials, returns 201', async () => {
        const client = setupClient({
            'INSERT INTO sales [(]': () => ({ rows: [{ id: 77, invoice_no: 'INV-20250101-1001' }] }),
            'INSERT INTO sales_items': () => ({ rows: [{ id: 900 }] }),
            '^SELECT id, is_serial_tracked': () => ({ rows: [{ id: 5, is_serial_tracked: false }] }),
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
            '^SELECT id, is_serial_tracked': () => ({ rows: [{ id: 5, is_serial_tracked: true }] }),
        });
        const body = validSaleBody();
        body.items = [{ product_id: 5, quantity: 1, unit_price: 500, serials: [] }];
        const res = mockRes();
        await sales.createSale({ body }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: expect.stringContaining('serial/barcode-tracked'),
        }));
        expect(client.query).toHaveBeenCalledWith('ROLLBACK');
        expect(client.query).not.toHaveBeenCalledWith('COMMIT');
    });

    test('wallet-insufficient failure: throws, rolls back and returns 500', async () => {
        setupClient({
            '^SELECT id, is_serial_tracked': () => ({ rows: [{ id: 5, is_serial_tracked: false }] }),
            'INSERT INTO sales [(]': () => ({ rows: [{ id: 78 }] }),
            'SELECT wallet_balance': () => ({ rows: [{ wallet_balance: 10 }] }), // far below tender
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
            'SELECT id, is_serial_tracked': () => ({ rows: [{ id: 5, is_serial_tracked: true }] }),
        });
        const res = mockRes();
        await sales.updateSale(
            { params: { id: 77 }, body: { ...validSaleBody(), items: [{ product_id: 5, quantity: 1, unit_price: 500 }] } },
            res
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: expect.stringContaining('serial/barcode-tracked'),
        }));
        expect(client.query).toHaveBeenCalledWith('ROLLBACK');
        expect(client.query).not.toHaveBeenCalledWith('COMMIT');
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
        const client = setupClient({
            'SELECT \\* FROM sales WHERE': () => ({ rows: [] }),
        });
        const res = mockRes();
        await sales.deleteSale({ params: { id: 999 } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });
});

describe('createExchangeSale', () => {
    test('happy path: creates exchange invoice, restocks returned items and commits', async () => {
        const client = setupClient({
            'INSERT INTO sales [(]': () => ({ rows: [{ id: 88, invoice_no: 'INV-EXC-20260101-1001' }] }),
            'INSERT INTO sales_items': () => ({ rows: [{ id: 950 }] }),
            '^SELECT id, is_serial_tracked': () => ({ rows: [{ id: 12, is_serial_tracked: false }] }),
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
            '^SELECT id, is_serial_tracked': () => ({ rows: [{ id: 15, is_serial_tracked: true }] }),
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
});
