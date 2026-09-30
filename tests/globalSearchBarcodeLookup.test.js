jest.mock('../config/db', () => {
    const { createPoolMock } = require('./mocks/poolMock');
    return createPoolMock();
});

const pool = require('../config/db');
const searchController = require('../controllers/searchController');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('Barcode & Serial Lookup Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('barcodeLookup returns 400 when code is empty', async () => {
        const req = { query: {} };
        const res = mockRes();
        await searchController.barcodeLookup(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    test('barcodeLookup finds sold serial and returns 4-dimension operational record', async () => {
        const req = { query: { code: 'SN-SOLD-999' } };
        const res = mockRes();

        pool.query.mockImplementation((sql, params) => {
            if (/sales_item_serials sis/.test(sql)) {
                return Promise.resolve({
                    rows: [{
                        serial_code: 'SN-SOLD-999',
                        product_id: 10,
                        product_name: 'Dahua 4MP Bullet Camera',
                        sku: 'DH-IPC-01',
                        barcode: '88001122',
                        stock: 5,
                        cost_price: 3500,
                        sale_price: 4800,
                        warranty_months: 12,
                        brand_name: 'Dahua',
                        category_name: 'Camera',
                        sale_id: 50,
                        invoice_no: 'INV-2026-050',
                        sale_date: '2026-03-01',
                        customer_name: 'Rahim Traders',
                        customer_phone: '01711000000',
                        sold_unit_price: 4800,
                        sold_quantity: 1,
                        po_id: 20,
                        po_number: 'PO-2026-020',
                        purchase_date: '2026-01-15',
                        purchase_cost_price: 3500,
                        supplier_name: 'Tech Distributor Ltd',
                        supplier_phone: '01811000000',
                    }]
                });
            }
            if (/warranty_claims/.test(sql) || /product_returns/.test(sql)) {
                return Promise.resolve({ rows: [] });
            }
            return Promise.resolve({ rows: [] });
        });

        await searchController.barcodeLookup(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        const data = res.json.mock.calls[0][0];
        expect(data.success).toBe(true);
        expect(data.match_type).toBe('SERIAL_SOLD');
        expect(data.data.serial_code).toBe('SN-SOLD-999');
        expect(data.data.product.name).toBe('Dahua 4MP Bullet Camera');
        expect(data.data.purchase.po_number).toBe('PO-2026-020');
        expect(data.data.purchase.supplier_name).toBe('Tech Distributor Ltd');
        expect(data.data.sale.invoice_no).toBe('INV-2026-050');
        expect(data.data.sale.customer_name).toBe('Rahim Traders');
        expect(data.data.inventory.unit_status).toBe('Sold to Customer');
        expect(data.data.warranty.warranty_months).toBe(12);
        expect(data.data.warranty.is_customer_warranty_valid).toBe(true);
    });

    test('barcodeLookup finds in-stock unsold serial in purchase_order_serials', async () => {
        const req = { query: { code: 'SN-STOCK-111' } };
        const res = mockRes();

        pool.query.mockImplementation((sql, params) => {
            if (/sales_item_serials sis/.test(sql)) {
                return Promise.resolve({ rows: [] }); // Not sold
            }
            if (/purchase_order_serials pos/.test(sql)) {
                return Promise.resolve({
                    rows: [{
                        serial_code: 'SN-STOCK-111',
                        product_id: 12,
                        product_name: 'Hikvision NVR 8CH',
                        sku: 'HK-NVR-08',
                        barcode: '88009988',
                        stock: 8,
                        cost_price: 7000,
                        sale_price: 9500,
                        warranty_months: 24,
                        brand_name: 'Hikvision',
                        category_name: 'NVR',
                        po_id: 25,
                        po_number: 'PO-2026-025',
                        purchase_date: '2026-02-10',
                        purchase_cost_price: 7000,
                        supplier_name: 'Global Security Sys',
                        supplier_phone: '01911000000',
                    }]
                });
            }
            return Promise.resolve({ rows: [] });
        });

        await searchController.barcodeLookup(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        const data = res.json.mock.calls[0][0];
        expect(data.success).toBe(true);
        expect(data.match_type).toBe('SERIAL_INVENTORY');
        expect(data.data.status).toBe('In Stock');
        expect(data.data.sale).toBeNull();
        expect(data.data.purchase.po_number).toBe('PO-2026-025');
        expect(data.data.inventory.unit_status).toBe('Available in Current Inventory');
    });

    test('barcodeLookup finds product by model barcode or SKU', async () => {
        const req = { query: { code: 'EAN-998877' } };
        const res = mockRes();

        pool.query.mockImplementation((sql, params) => {
            if (/sales_item_serials sis/.test(sql) || /purchase_order_serials pos/.test(sql)) {
                return Promise.resolve({ rows: [] });
            }
            if (/FROM products p/.test(sql)) {
                return Promise.resolve({
                    rows: [{
                        product_id: 15,
                        product_name: 'TP-Link Router AC1200',
                        sku: 'TPL-AC1200',
                        barcode: 'EAN-998877',
                        stock: 20,
                        min_stock: 5,
                        cost_price: 2200,
                        sale_price: 2800,
                        warranty_months: 12,
                        brand_name: 'TP-Link',
                        category_name: 'Networking',
                    }]
                });
            }
            return Promise.resolve({ rows: [] });
        });

        await searchController.barcodeLookup(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        const data = res.json.mock.calls[0][0];
        expect(data.success).toBe(true);
        expect(data.match_type).toBe('PRODUCT_BARCODE');
        expect(data.data.product.name).toBe('TP-Link Router AC1200');
        expect(data.data.inventory.stock).toBe(20);
    });

    test('barcodeLookup returns 404 when no serial or barcode found', async () => {
        const req = { query: { code: 'NON-EXISTENT-CODE' } };
        const res = mockRes();

        pool.query.mockImplementation(() => Promise.resolve({ rows: [] }));

        await searchController.barcodeLookup(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
});
