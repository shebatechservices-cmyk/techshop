jest.mock('../config/db', () => {
    const { createPoolMock } = require('./mocks/poolMock');
    return createPoolMock();
});

const pool = require('../config/db');
const productController = require('../controllers/productController');
const uomController = require('../controllers/uomController');

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
        expect(deductedStock).toBe(20);
    });

    test('updateProduct successfully updates unit_name from Pcs to Meter', async () => {
        const req = {
            params: { id: 105 },
            body: {
                name: 'Cat.6 Cable',
                unit_name: 'Meter',
                sub_unit_name: null,
                conversion_rate: 1
            }
        };
        const res = mockRes();

        let updatedParams = [];
        pool.query.mockImplementation((sql, params) => {
            if (/UPDATE products SET/.test(sql)) {
                updatedParams = params;
                return Promise.resolve({
                    rows: [{
                        id: 105,
                        name: 'Cat.6 Cable',
                        unit_name: 'Meter',
                        sub_unit_name: null,
                        conversion_rate: 1,
                        stock: 100
                    }]
                });
            }
            return Promise.resolve({ rows: [] });
        });

        await productController.updateProduct(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const data = res.json.mock.calls[0][0].data;
        expect(data.unit_name).toBe('Meter');
        expect(data.sub_unit_name).toBeNull();
        expect(updatedParams[17]).toBe('Meter'); // $18
        expect(updatedParams[18]).toBeNull(); // $19
        expect(updatedParams[25]).toBe(true); // $26 hasUnitName
    });

    test('updateProduct successfully updates fractional sub-unit settings (Box -> Roll, Feet)', async () => {
        const req = {
            params: { id: 106 },
            body: {
                name: 'Fiber Optic Drop Cable',
                unit_name: 'Roll',
                sub_unit_name: 'Feet',
                conversion_rate: 1000,
                sub_unit_selling_price: 3.50,
                sub_unit_barcode: 'OPTIC-FEET-01'
            }
        };
        const res = mockRes();

        pool.query.mockImplementation((sql, params) => {
            if (/UPDATE products SET/.test(sql)) {
                return Promise.resolve({
                    rows: [{
                        id: 106,
                        name: 'Fiber Optic Drop Cable',
                        unit_name: 'Roll',
                        sub_unit_name: 'Feet',
                        conversion_rate: 1000,
                        sub_unit_selling_price: 3.50,
                        sub_unit_barcode: 'OPTIC-FEET-01',
                        stock: 5
                    }]
                });
            }
            return Promise.resolve({ rows: [] });
        });

        await productController.updateProduct(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const data = res.json.mock.calls[0][0].data;
        expect(data.unit_name).toBe('Roll');
        expect(data.sub_unit_name).toBe('Feet');
        expect(data.conversion_rate).toBe(1000);
        expect(data.sub_unit_selling_price).toBe(3.5);
    });

    test('RULE 1 & 3: uomController supports full CRUD with fractional flag and delete protection', async () => {
        const mockUoms = [
            { id: 1, name: 'Piece', code: 'PCS', is_fractional_allowed: false, is_active: true },
            { id: 2, name: 'Meter', code: 'MTR', is_fractional_allowed: true, is_active: true },
            { id: 3, name: 'Archived Unit', code: 'ARC', is_fractional_allowed: false, is_active: false }
        ];

        pool.query.mockImplementation((sql, params) => {
            const q = String(sql);
            if (/CREATE TABLE IF NOT EXISTS units_of_measurement/.test(q)) {
                return Promise.resolve({ rows: [] });
            }
            if (/SELECT COUNT\(\*\) FROM units_of_measurement/.test(q)) {
                return Promise.resolve({ rows: [{ count: '3' }] });
            }
            if (/WHERE LOWER\(TRIM\(name\)\)/.test(q)) {
                const found = mockUoms.find(u => 
                    u.name.toLowerCase() === String(params[0]).toLowerCase() && 
                    (!params[1] || u.id !== Number(params[1]))
                );
                return Promise.resolve({ rows: found ? [found] : [] });
            }
            if (/FROM units_of_measurement/.test(q)) {
                if (/WHERE id = \$1/.test(q)) {
                    const found = mockUoms.find(u => u.id === Number(params[0]));
                    return Promise.resolve({ rows: found ? [found] : [] });
                }
                if (/is_active = true/.test(q)) {
                    return Promise.resolve({ rows: mockUoms.filter(u => u.is_active) });
                }
                return Promise.resolve({ rows: mockUoms });
            }
            if (/INSERT INTO units_of_measurement/.test(q)) {
                const newUom = {
                    id: 4,
                    name: params[0],
                    code: params[1],
                    is_fractional_allowed: params[2],
                    is_active: params[3]
                };
                mockUoms.push(newUom);
                return Promise.resolve({ rows: [newUom] });
            }
            if (/UPDATE units_of_measurement/.test(q)) {
                return Promise.resolve({
                    rows: [{
                        id: 4,
                        name: 'Kilogram',
                        code: 'KG',
                        is_fractional_allowed: true,
                        is_active: true
                    }]
                });
            }
            if (/SELECT COUNT\(\*\) FROM products WHERE unit_name = \$1/.test(q)) {
                // If checking 'Piece', pretend 5 products use it; if 'Kilogram', 0 products
                if (params[0] === 'Piece') {
                    return Promise.resolve({ rows: [{ count: '5' }] });
                }
                return Promise.resolve({ rows: [{ count: '0' }] });
            }
            if (/DELETE FROM units_of_measurement WHERE id = \$1/.test(q)) {
                return Promise.resolve({ rows: [{ id: params[0] }] });
            }
            return Promise.resolve({ rows: [], rowCount: 0 });
        });

        // 1. GET all UOMs vs active only
        const reqAll = { query: {} };
        const resAll = mockRes();
        await uomController.getAllUom(reqAll, resAll);
        expect(resAll.status).toHaveBeenCalledWith(200);
        expect(resAll.json.mock.calls[0][0].data.length).toBe(3);

        const reqActive = { query: { active_only: 'true' } };
        const resActive = mockRes();
        await uomController.getAllUom(reqActive, resActive);
        expect(resActive.status).toHaveBeenCalledWith(200);
        expect(resActive.json.mock.calls[0][0].data.length).toBe(2);

        // 2. POST create new UOM
        const reqCreate = {
            body: {
                name: 'Kilogram',
                code: 'KG',
                is_fractional_allowed: true,
                is_active: true
            }
        };
        const resCreate = mockRes();
        await uomController.createUom(reqCreate, resCreate);
        expect(resCreate.status).toHaveBeenCalledWith(201);
        const created = resCreate.json.mock.calls[0][0].data;
        expect(created.name).toBe('Kilogram');
        expect(created.code).toBe('KG');
        expect(created.is_fractional_allowed).toBe(true);

        // 3. PUT update UOM
        const reqUpdate = {
            params: { id: 4 },
            body: {
                name: 'Kilogram',
                code: 'KG',
                is_fractional_allowed: true,
                is_active: true
            }
        };
        const resUpdate = mockRes();
        await uomController.updateUom(reqUpdate, resUpdate);
        expect(resUpdate.status).toHaveBeenCalledWith(200);

        // 4. DELETE UOM in use -> rejection
        const reqDeleteInUse = { params: { id: 1 } }; // Piece (in use)
        const resDeleteInUse = mockRes();
        await uomController.deleteUom(reqDeleteInUse, resDeleteInUse);
        expect(resDeleteInUse.status).toHaveBeenCalledWith(400);

        // 5. DELETE unused UOM -> success
        const reqDeleteUnused = { params: { id: 4 } }; // Kilogram (not in use)
        const resDeleteUnused = mockRes();
        await uomController.deleteUom(reqDeleteUnused, resDeleteUnused);
        expect(resDeleteUnused.status).toHaveBeenCalledWith(200);
        expect(resDeleteUnused.json.mock.calls[0][0].success).toBe(true);
    });
});
