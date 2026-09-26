jest.mock('../config/db', () => {
    const { createPoolMock } = require('./mocks/poolMock');
    return createPoolMock();
});

const pool = require('../config/db');
const productController = require('../controllers/productController');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

beforeEach(() => {
    pool.connect.mockReset();
    pool.query.mockReset();
    pool.query.mockResolvedValue({ rows: [], rowCount: 0 });
});

describe('Product Bundle and UoM Features', () => {
    test('createProduct successfully saves a Bundle Kit with components', async () => {
        const req = {
            body: {
                name: 'CCTV 4-Cam Surveillance Package',
                sku: 'KIT-CCTV-4CAM',
                selling_price: 18500,
                is_bundle: true,
                bundle_items: [
                    { product_id: 10, quantity: 4, unit_price: 2500 },
                    { product_id: 11, quantity: 1, unit_price: 4500 },
                    { product_id: 12, quantity: 1, unit_price: 4000 }
                ]
            }
        };
        const res = mockRes();

        pool.query.mockImplementation((sql, params) => {
            if (/SELECT id FROM products/.test(sql)) {
                return Promise.resolve({ rows: [] });
            }
            if (/INSERT INTO products/.test(sql)) {
                return Promise.resolve({
                    rows: [{
                        id: 99,
                        name: req.body.name,
                        sku: req.body.sku,
                        selling_price: req.body.selling_price,
                        is_bundle: true,
                        unit_name: 'Pcs'
                    }]
                });
            }
            if (/INSERT INTO product_bundle_items/.test(sql)) {
                return Promise.resolve({ rows: [{ id: 1 }], rowCount: 1 });
            }
            return Promise.resolve({ rows: [], rowCount: 0 });
        });

        await productController.createProduct(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        const data = res.json.mock.calls[0][0].data;
        expect(data.is_bundle).toBe(true);
        expect(data.bundle_items.length).toBe(3);
    });

    test('createProduct successfully saves dual-UoM conversion settings (Box -> Meters)', async () => {
        const req = {
            body: {
                name: 'Cat.6 UTP Cable Box 305m',
                sku: 'CBL-CAT6-305M',
                barcode: '8901234567890',
                unit_name: 'Box',
                sub_unit_name: 'Meter',
                conversion_rate: 305,
                sub_unit_selling_price: 15.00,
                sub_unit_barcode: '8901234567891',
                purchase_price: 3800,
                selling_price: 4400,
                stock: 10
            }
        };
        const res = mockRes();

        pool.query.mockImplementation((sql, params) => {
            if (/SELECT id FROM products/.test(sql)) {
                return Promise.resolve({ rows: [] });
            }
            if (/INSERT INTO products/.test(sql)) {
                return Promise.resolve({
                    rows: [{
                        id: 105,
                        ...req.body,
                        is_bundle: false
                    }]
                });
            }
            return Promise.resolve({ rows: [], rowCount: 0 });
        });

        await productController.createProduct(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        const data = res.json.mock.calls[0][0].data;
        expect(data.unit_name).toBe('Box');
        expect(data.sub_unit_name).toBe('Meter');
        expect(data.conversion_rate).toBe(305);
        expect(data.sub_unit_selling_price).toBe(15);
        expect(data.sub_unit_barcode).toBe('8901234567891');
    });

    test('getAllProducts calculates virtual stock correctly for bundles', async () => {
        const req = {};
        const res = mockRes();

        pool.query.mockImplementation((sql) => {
            if (/FROM products p/.test(sql)) {
                return Promise.resolve({
                    rows: [
                        { id: 1, name: 'Camera 2MP', stock: 10, selling_price: 2500, is_bundle: false },
                        { id: 2, name: '4-Channel DVR', stock: 3, selling_price: 4500, is_bundle: false },
                        { id: 3, name: '4-Cam Bundle Package', stock: 0, selling_price: 14500, is_bundle: true }
                    ]
                });
            }
            if (/FROM product_bundle_items bi/.test(sql)) {
                return Promise.resolve({
                    rows: [
                        { id: 1, bundle_id: 3, product_id: 1, component_name: 'Camera 2MP', component_stock: 10, quantity: 4 },
                        { id: 2, bundle_id: 3, product_id: 2, component_name: '4-Channel DVR', component_stock: 3, quantity: 1 }
                    ]
                });
            }
            return Promise.resolve({ rows: [] });
        });

        await productController.getAllProducts(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const prods = res.json.mock.calls[0][0].data;
        const bundle = prods.find(p => p.id === 3);
        expect(bundle).toBeDefined();
        // Virtual stock: Math.min(Math.floor(10/4), Math.floor(3/1)) = Math.min(2, 3) = 2
        expect(bundle.stock).toBe(2);
        expect(bundle.bundle_items.length).toBe(2);
    });

    test('Purchase of 1 Box increases stock by 305 Meters', async () => {
        const purchaseCreate = require('../controllers/purchase/purchaseOrderCreateController');
        const req = {
            body: {
                supplier_id: 1,
                items: [
                    {
                        product_id: 105,
                        quantity: 1, // 1 Box
                        cost_price: 3800,
                        sale_price: 4400,
                        expected_date: '2026-09-26',
                        unit_type: 'base_unit'
                    }
                ],
                payments: [{ amount: 3800, method: 'Cash' }]
            }
        };
        const res = mockRes();

        let updatedStockIncrement = 0;
        const mockClient = {
            query: jest.fn().mockImplementation((sql, params) => {
                if (/BEGIN|COMMIT|ROLLBACK/.test(sql)) return Promise.resolve({});
                if (/SELECT.*FROM suppliers/.test(sql)) {
                    return Promise.resolve({ rows: [{ id: 1, name: 'Main Cable Importer' }] });
                }
                if (/SELECT.*FROM products WHERE id/.test(sql)) {
                    return Promise.resolve({
                        rows: [{
                            id: 105,
                            name: 'Cat.6 Cable Box',
                            conversion_rate: 305,
                            unit_name: 'Box',
                            sub_unit_name: 'Meter',
                            stock: 0
                        }]
                    });
                }
                if (/INSERT INTO purchase_orders/.test(sql)) {
                    return Promise.resolve({ rows: [{ id: 501, po_number: 'PO-20260926-001' }] });
                }
                if (/INSERT INTO purchase_order_items/.test(sql)) {
                    return Promise.resolve({ rows: [{ id: 1001 }] });
                }
                if (/UPDATE products\s+SET stock = COALESCE\(stock, 0\) \+ \$1/.test(sql)) {
                    updatedStockIncrement = params[0];
                    return Promise.resolve({ rows: [] });
                }
                if (/INSERT INTO stock_levels/.test(sql)) {
                    return Promise.resolve({ rows: [] });
                }
                if (/SELECT.*FROM payment_accounts/.test(sql)) {
                    return Promise.resolve({ rows: [{ id: 1, name: 'Cash Drawer', balance: 50000 }] });
                }
                return Promise.resolve({ rows: [], rowCount: 0 });
            }),
            release: jest.fn()
        };
        pool.connect.mockResolvedValue(mockClient);

        await purchaseCreate.createOrder(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        // 1 Box * 305 = 305 Meters added to stock
        expect(updatedStockIncrement).toBe(305);
    });

    test('POS sale of 20 Meters deducts exactly 20 Meters from stock', async () => {
        const salesOrder = require('../controllers/sales/salesOrderController');
        const req = {
            body: {
                customer_id: 1,
                items: [
                    {
                        product_id: 105,
                        quantity: 20, // 20 Meters
                        unit_price: 14.43,
                        cost_price: 12.46,
                        unit_type: 'sub_unit',
                        unit_name: 'Meter'
                    }
                ],
                payments: [{ amount: 288.60, method: 'Cash' }]
            }
        };
        const res = mockRes();

        let deductedStock = 0;
        const mockClient = {
            query: jest.fn().mockImplementation((sql, params) => {
                if (/BEGIN|COMMIT|ROLLBACK/.test(sql)) return Promise.resolve({});
                if (/SELECT.*FROM products WHERE id/.test(sql)) {
                    return Promise.resolve({
                        rows: [{
                            id: 105,
                            name: 'Cat.6 Cable Box',
                            conversion_rate: 305,
                            unit_name: 'Box',
                            sub_unit_name: 'Meter',
                            stock: 305
                        }]
                    });
                }
                if (/INSERT INTO sales\s*\(/.test(sql)) {
                    return Promise.resolve({ rows: [{ id: 701, invoice_no: 'INV-20260926-001' }] });
                }
                if (/INSERT INTO sales_items/.test(sql)) {
                    return Promise.resolve({ rows: [{ id: 2001 }] });
                }
                if (/UPDATE products\s+SET stock = GREATEST\(0, COALESCE\(stock, 0\) - \$1\)/.test(sql)) {
                    deductedStock = params[0];
                    return Promise.resolve({ rows: [] });
                }
                if (/SELECT.*FROM payment_accounts/.test(sql)) {
                    return Promise.resolve({ rows: [{ id: 1, name: 'Cash Drawer', balance: 50000 }] });
                }
                return Promise.resolve({ rows: [], rowCount: 0 });
            }),
            release: jest.fn()
        };
        pool.connect.mockResolvedValue(mockClient);

        await salesOrder.createSale(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        // Selling 20 Meters in sub-unit deducts exactly 20 Meters from inventory
        expect(deductedStock).toBe(20);
    });
});
