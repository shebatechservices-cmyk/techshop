// Shared test helpers and client mocking for Sales Controller test suites

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const setupClient = (pool, handlers = {}) => {
    const defaultHandlers = {
        'FROM products': (_text, params) => {
            const id = params && params[0] ? params[0] : 5;
            return { rows: [{ id, name: 'Test Product', stock: 100, is_serial_tracked: false, is_bundle: false }] };
        },
        'FROM payment_accounts': () => ({ rows: [{ id: 1 }] }),
    };
    const runQuery = (text, params) => {
        if (/nextval/.test(text)) return Promise.resolve({ rows: [{ seq: 1001 }] });
        for (const [pattern, handler] of Object.entries(handlers)) {
            if (new RegExp(pattern).test(text)) {
                return Promise.resolve(handler(text, params));
            }
        }
        for (const [pattern, handler] of Object.entries(defaultHandlers)) {
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

const validSaleBody = () => ({
    customer_id: 10,
    items: [{ product_id: 5, quantity: 2, unit_price: 500, cost_price: 400 }],
    discount: 100,
    vat: 50,
    paid_amount: 1000,
    payment_method_id: 1,
    payment_details: [],
});

module.exports = {
    mockRes,
    setupClient,
    validSaleBody,
};
