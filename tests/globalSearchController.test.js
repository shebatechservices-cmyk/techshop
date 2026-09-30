jest.mock('../config/db', () => {
    const { createPoolMock } = require('./mocks/poolMock');
    return createPoolMock();
});

const pool = require('../config/db');
const { globalSearch } = require('../controllers/search/globalSearchController');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('globalSearchController - Serial Precision & Navigation', () => {
    beforeEach(() => {
        pool.query.mockReset();
    });

    test('returns empty search if query is empty or too short', async () => {
        const req = { query: { q: '  ' } };
        const res = mockRes();

        await globalSearch(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const data = res.json.mock.calls[0][0].data;
        expect(data.products).toEqual([]);
        expect(data.sales).toEqual([]);
    });

    test('executes product search with matched_serial and matched_serial_status correctly', async () => {
        const req = { query: { q: '2026060100302' } };
        const res = mockRes();

        pool.query.mockImplementation((sql, params) => {
            if (/FROM products/i.test(sql)) {
                return Promise.resolve({
                    rows: [
                        {
                            id: 10,
                            name: 'ONU DBC NETWORKING',
                            sku: 'DBC-ONU-01',
                            barcode: '880011',
                            stock: 2,
                            matched_serial: '2026060100302',
                            matched_serial_status: 'In Stock',
                            sales_history: [], // Exactly zero sales for this unsold serial
                            purchase_history: [
                                {
                                    po_id: 5,
                                    po_number: 'PO-20260930-1003',
                                    supplier_name: 'DBC Supplier',
                                    cost_price: 1200,
                                }
                            ],
                            warranty_claims: [],
                            returns_refunds: [],
                        }
                    ]
                });
            }
            return Promise.resolve({ rows: [] });
        });

        await globalSearch(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const json = res.json.mock.calls[0][0];
        expect(json.success).toBe(true);
        expect(json.data.products).toHaveLength(1);

        const prod = json.data.products[0];
        expect(prod.matched_serial).toBe('2026060100302');
        expect(prod.matched_serial_status).toBe('In Stock');
        expect(prod.sales_history).toHaveLength(0); // Never sold
        expect(prod.purchase_history).toHaveLength(1);
        expect(prod.purchase_history[0].po_number).toBe('PO-20260930-1003');
    });
});
