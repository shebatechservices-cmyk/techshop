// Reusable pool/client mock: pool.query for direct queries, pool.connect()
// hands out a client whose query dispatches to per-test handlers.
// The module IS the pool (matching config/db's export shape).
const createPoolMock = () => ({
    query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    connect: jest.fn().mockResolvedValue({
        query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
        release: jest.fn(),
    }),
});

const pool = createPoolMock();
pool.createPoolMock = createPoolMock;
module.exports = pool;
