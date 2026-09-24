// Comprehensive Audit & Validation Suite for Multi-Account, Wallet, and Cash-Drawer Flow
jest.mock('../config/db', () => {
    const { createPoolMock } = require('./mocks/poolMock');
    return createPoolMock();
});

const pool = require('../config/db');
const salesController = require('../controllers/salesController');
const purchaseController = require('../controllers/purchaseController');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('Multi-Account, Wallet, and Cash-Drawer Transaction Flow Audit', () => {
    let executedQueries = [];

    const setupLiveMock = (initialState) => {
        executedQueries = [];
        const state = {
            paymentAccounts: initialState.paymentAccounts || [
                { id: 1, name: 'Main Cash Drawer', account_type: 'drawer', balance: 5000 },
                { id: 2, name: 'bKash Merchant', account_type: 'mfs', balance: 10000, account_number: '01700000000' },
                { id: 3, name: 'City Bank AC', account_type: 'bank', balance: 50000, account_number: '123456789' },
            ],
            customers: initialState.customers || [
                { id: 10, name: 'Rahim Traders', wallet_balance: 3000, receivable_balance: 1500, loyalty_points: 50 }
            ],
            suppliers: initialState.suppliers || [
                { id: 20, name: 'Global Tech Dist.', wallet_balance: 4000, payable_balance: 8000 }
            ],
            products: initialState.products || [
                { id: 100, name: 'Security Camera 4MP', stock: 50, is_serial_tracked: false, warranty_months: 12 }
            ],
            sales: [],
            salesItems: [],
            accountTransactions: [],
            walletTransactions: [],
            purchaseOrders: [],
            purchaseOrderPayments: [],
        };

        const client = {
            query: jest.fn(async (sql, params = []) => {
                executedQueries.push({ sql, params });
                const queryStr = typeof sql === 'string' ? sql : sql.text;

                if (/BEGIN|COMMIT|ROLLBACK/i.test(queryStr)) {
                    return { rows: [], rowCount: 0 };
                }
                if (/ALTER TABLE|CREATE TABLE|CREATE SEQUENCE/i.test(queryStr)) {
                    return { rows: [], rowCount: 0 };
                }
                if (/nextval/i.test(queryStr)) {
                    return { rows: [{ seq: 5001, next_val: 5001 }] };
                }
                if (/SELECT id, is_serial_tracked/i.test(queryStr)) {
                    return { rows: [{ id: 100, is_serial_tracked: false }] };
                }

                // Payment accounts queries
                if (/SELECT \* FROM payment_accounts WHERE id = \$1/i.test(queryStr)) {
                    const acc = state.paymentAccounts.find(a => a.id === Number(params[0]));
                    return { rows: acc ? [acc] : [] };
                }
                if (/SELECT \* FROM payment_accounts WHERE LOWER\(name\) = LOWER\(\$1\)/i.test(queryStr)) {
                    const acc = state.paymentAccounts.find(a => a.name.toLowerCase() === String(params[0]).toLowerCase());
                    return { rows: acc ? [acc] : [] };
                }
                if (/FROM payment_accounts/i.test(queryStr)) {
                    return { rows: state.paymentAccounts };
                }

                // Customer queries
                if (/SELECT .* FROM customers WHERE id = \$1/i.test(queryStr)) {
                    const cust = state.customers.find(c => c.id === Number(params[0]));
                    return { rows: cust ? [cust] : [] };
                }

                // Supplier queries
                if (/SELECT .* FROM suppliers WHERE id = \$1/i.test(queryStr)) {
                    const sup = state.suppliers.find(s => s.id === Number(params[0]));
                    return { rows: sup ? [sup] : [] };
                }

                // Product queries
                if (/SELECT .* FROM products WHERE id = \$1/i.test(queryStr)) {
                    const prod = state.products.find(p => p.id === Number(params[0]));
                    return { rows: prod ? [prod] : [] };
                }

                // Sales queries
                if (/INSERT INTO sales \(/i.test(queryStr)) {
                    const sale = {
                        id: 701,
                        invoice_no: params[0],
                        customer_id: params[1],
                        subtotal: params[2],
                        discount: params[3],
                        vat: params[4],
                        total_amount: params[9],
                        paid_amount: params[10],
                        due_amount: params[11],
                        payment_status: params[12],
                        payment_details: params[13],
                        created_at: new Date(),
                    };
                    state.sales.push(sale);
                    return { rows: [sale] };
                }

                if (/SELECT \* FROM sales WHERE id = \$1/i.test(queryStr)) {
                    const s = state.sales.find(x => x.id === Number(params[0]));
                    return { rows: s ? [s] : [] };
                }

                if (/SELECT \* FROM sales_items WHERE sale_id = \$1/i.test(queryStr)) {
                    return { rows: state.salesItems.filter(si => si.sale_id === Number(params[0])) };
                }

                if (/INSERT INTO sales_items/i.test(queryStr)) {
                    const item = { id: 901, sale_id: params[0], product_id: params[1], quantity: params[2], line_total: params[5] };
                    state.salesItems.push(item);
                    return { rows: [item] };
                }

                if (/UPDATE sales SET/i.test(queryStr)) {
                    const id = Number(params[params.length - 1]);
                    const sale = state.sales.find(s => s.id === id);
                    if (sale) {
                        sale.paid_amount = params[9];
                        sale.due_amount = params[10];
                        sale.payment_details = params[12];
                    }
                    return { rows: sale ? [sale] : [{ id }] };
                }

                if (/INSERT INTO account_transactions/i.test(queryStr)) {
                    let type = 'unknown';
                    let amount = 0;
                    let ref = '';
                    let note = '';
                    if (/'deposit'/i.test(queryStr)) {
                        type = 'deposit';
                        amount = params[1];
                        ref = params[2];
                        note = params[3];
                    } else if (/'refund'/i.test(queryStr)) {
                        type = 'refund';
                        amount = params[1];
                        ref = params[2];
                        note = params[3];
                    } else {
                        type = params[1];
                        amount = params[2];
                        ref = params[3];
                        note = params[4];
                    }
                    const tx = { account_id: params[0], type, amount, reference: ref, note };
                    state.accountTransactions.push(tx);
                    return { rows: [tx] };
                }

                if (/INSERT INTO wallet_transactions/i.test(queryStr)) {
                    let party_type, party_id, type, amount, credit;
                    if (params.length >= 18) {
                        // Extended unified schema
                        party_type = params[4];
                        party_id = params[5];
                        type = params[7];
                        amount = params[8];
                        credit = params[9];
                    } else {
                        party_type = params[0];
                        party_id = params[1];
                        type = params[3];
                        amount = params[4];
                        credit = params[5];
                    }
                    const wx = {
                        party_type, party_id, type, amount, credit,
                    };
                    state.walletTransactions.push(wx);
                    return { rows: [wx] };
                }

                // Dynamic updates
                if (/UPDATE payment_accounts SET balance = balance \+ \$1 WHERE id = \$2/i.test(queryStr)) {
                    const acc = state.paymentAccounts.find(a => a.id === Number(params[1]));
                    if (acc) acc.balance += Number(params[0]);
                    return { rows: [] };
                }
                if (/UPDATE payment_accounts SET balance = GREATEST\(0, balance - \$1\) WHERE id = \$2/i.test(queryStr)) {
                    const acc = state.paymentAccounts.find(a => a.id === Number(params[1]));
                    if (acc) acc.balance = Math.max(0, acc.balance - Number(params[0]));
                    return { rows: [] };
                }
                if (/UPDATE customers SET wallet_balance = wallet_balance - \$1 WHERE id = \$2/i.test(queryStr)) {
                    const cust = state.customers.find(c => c.id === Number(params[1]));
                    if (cust) cust.wallet_balance -= Number(params[0]);
                    return { rows: [] };
                }
                if (/UPDATE customers SET wallet_balance = COALESCE\(wallet_balance, 0\) \+ \$1 WHERE id = \$2/i.test(queryStr)) {
                    const cust = state.customers.find(c => c.id === Number(params[1]));
                    if (cust) cust.wallet_balance += Number(params[0]);
                    return { rows: [] };
                }
                if (/UPDATE customers\s+SET receivable_balance\s*=\s*COALESCE\(receivable_balance,\s*0\)\s*\+\s*\$1/i.test(queryStr)) {
                    const custId = params[2] !== undefined ? params[2] : params[1];
                    const cust = state.customers.find(c => c.id === Number(custId));
                    if (cust) cust.receivable_balance += Number(params[0]);
                    return { rows: [] };
                }
                if (/UPDATE customers SET receivable_balance = GREATEST\(0, COALESCE\(receivable_balance, 0\) \+ \$1\)/i.test(queryStr)) {
                    const cust = state.customers.find(c => c.id === Number(params[1]));
                    if (cust) cust.receivable_balance += Number(params[0]);
                    return { rows: [] };
                }
                if (/UPDATE customers SET receivable_balance = GREATEST\(0, COALESCE\(receivable_balance, 0\) - \$1\)/i.test(queryStr)) {
                    const cust = state.customers.find(c => c.id === Number(params[1]));
                    if (cust) cust.receivable_balance = Math.max(0, cust.receivable_balance - Number(params[0]));
                    return { rows: [] };
                }

                return { rows: [], rowCount: 0 };
            }),
            release: jest.fn(),
        };

        pool.connect.mockResolvedValue(client);
        return { client, state };
    };

    beforeEach(() => {
        pool.connect.mockReset();
        pool.query.mockReset();
        pool.query.mockResolvedValue({ rows: [], rowCount: 0 });
    });

    test('POS Sale Split Tender: Cash Drawer + bKash MFS + Customer Wallet + Due correctly updates all sub-ledgers', async () => {
        const { state } = setupLiveMock({});

        // Sale of ৳ 10,000
        // Payment split:
        // - Cash: ৳ 2,000 (Account 1)
        // - bKash: ৳ 3,000 (Account 2)
        // - Wallet: ৳ 1,500 (Customer 10 Wallet)
        // - Remaining Due: ৳ 3,500
        const req = {
            body: {
                customer_id: 10,
                items: [{ product_id: 100, quantity: 2, unit_price: 5000, cost_price: 3500 }],
                subtotal: 10000,
                discount: 0,
                payment_tenders: [
                    { payment_mode: 'Cash', account_id: 1, amount: 2000 },
                    { payment_mode: 'bKash', account_id: 2, amount: 3000 },
                    { payment_mode: 'Wallet', method: 'wallet', amount: 1500 },
                ],
            }
        };

        const res = mockRes();
        await salesController.createSale(req, res);

        expect(res.status).toHaveBeenCalledWith(201);

        // 1. Verify Cash Drawer balance: 5000 + 2000 = 7000
        const drawer = state.paymentAccounts.find(a => a.id === 1);
        expect(drawer.balance).toBe(7000);

        // 2. Verify bKash account balance: 10000 + 3000 = 13000
        const bkash = state.paymentAccounts.find(a => a.id === 2);
        expect(bkash.balance).toBe(13000);

        // 3. Verify Customer Wallet balance: 3000 - 1500 = 1500
        const customer = state.customers.find(c => c.id === 10);
        expect(customer.wallet_balance).toBe(1500);

        // 4. Verify Customer Due balance: 1500 + 3500 = 5000
        expect(customer.receivable_balance).toBe(5000);

        // 5. Verify Account transactions logged for Cash and bKash
        expect(state.accountTransactions).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ account_id: 1, type: 'deposit', amount: 2000 }),
                expect.objectContaining({ account_id: 2, type: 'deposit', amount: 3000 }),
            ])
        );

        // 6. Verify Wallet transactions logged for customer wallet payment
        expect(state.walletTransactions).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ party_type: 'customer', party_id: 10, amount: 1500, credit: false }),
            ])
        );
    });

    test('Sale Update: seamlessly reverses old tenders and applies new split tenders across accounts', async () => {
        const { state } = setupLiveMock({
            paymentAccounts: [
                { id: 1, name: 'Main Cash Drawer', account_type: 'drawer', balance: 7000 },
                { id: 2, name: 'bKash Merchant', account_type: 'mfs', balance: 13000 },
                { id: 3, name: 'City Bank AC', account_type: 'bank', balance: 50000 },
            ],
            customers: [
                { id: 10, name: 'Rahim Traders', wallet_balance: 1500, receivable_balance: 5000 }
            ],
        });

        // Original sale: Cash ৳ 2000, bKash ৳ 3000, Wallet ৳ 1500
        state.sales = [{
            id: 701,
            invoice_no: 'INV-20260101-5001',
            customer_id: 10,
            total_amount: 10000,
            paid_amount: 6500,
            due_amount: 3500,
            subtotal: 10000,
            payment_details: [
                { payment_mode: 'Cash', account_id: 1, amount: 2000 },
                { payment_mode: 'bKash', account_id: 2, amount: 3000 },
                { payment_mode: 'Wallet', method: 'wallet', amount: 1500 },
            ],
            created_at: new Date(),
        }];

        // Update sale: New tenders -> City Bank ৳ 5000, Wallet ৳ 2500 (extra ৳ 1000 from wallet)
        const req = {
            params: { id: 701 },
            body: {
                customer_id: 10,
                subtotal: 10000,
                items: [{ product_id: 100, quantity: 2, unit_price: 5000, cost_price: 3500 }],
                paid_amount: 7500,
                payment_details: [
                    { payment_mode: 'City Bank AC', account_id: 3, amount: 5000 },
                    { payment_mode: 'Wallet', method: 'wallet', amount: 2500 },
                ],
            }
        };

        const res = mockRes();
        await salesController.updateSale(req, res);

        expect(res.status).toHaveBeenCalledWith(200);

        // 1. Cash Drawer reversed: 7000 - 2000 = 5000
        const drawer = state.paymentAccounts.find(a => a.id === 1);
        expect(drawer.balance).toBe(5000);

        // 2. bKash reversed: 13000 - 3000 = 10000
        const bkash = state.paymentAccounts.find(a => a.id === 2);
        expect(bkash.balance).toBe(10000);

        // 3. Bank Account credited: 50000 + 5000 = 55000
        const bank = state.paymentAccounts.find(a => a.id === 3);
        expect(bank.balance).toBe(55000);

        // 4. Customer Wallet: 1500 (initial) + 1500 (reversal) - 2500 (new) = 500
        const customer = state.customers.find(c => c.id === 10);
        expect(customer.wallet_balance).toBe(500);

        // 5. Customer Due: Old due was 3500, new due is 2500 -> net delta is -1000 -> 5000 - 1000 = 4000
        expect(customer.receivable_balance).toBe(4000);
    });

    test('Delete Sale Rollback: reverses Cash, bKash, Wallet, and Due with exact symmetry', async () => {
        const { state } = setupLiveMock({
            paymentAccounts: [
                { id: 1, name: 'Main Cash Drawer', account_type: 'drawer', balance: 7000 },
                { id: 2, name: 'bKash Merchant', account_type: 'mfs', balance: 13000 },
            ],
            customers: [
                { id: 10, name: 'Rahim Traders', wallet_balance: 1500, receivable_balance: 5000 }
            ],
        });

        // Existing sale to delete
        state.sales = [{
            id: 701,
            invoice_no: 'INV-20260101-5001',
            customer_id: 10,
            total_amount: 10000,
            paid_amount: 6500,
            due_amount: 3500,
            payment_details: [
                { payment_mode: 'Cash', account_id: 1, amount: 2000 },
                { payment_mode: 'bKash', account_id: 2, amount: 3000 },
                { payment_mode: 'Wallet', method: 'wallet', amount: 1500 },
            ],
            created_at: new Date(),
        }];

        const res = mockRes();
        await salesController.deleteSale({ params: { id: 701 } }, res);

        expect(res.status).toHaveBeenCalledWith(200);

        // 1. Cash Drawer rolled back: 7000 - 2000 = 5000
        const drawer = state.paymentAccounts.find(a => a.id === 1);
        expect(drawer.balance).toBe(5000);

        // 2. bKash rolled back: 13000 - 3000 = 10000
        const bkash = state.paymentAccounts.find(a => a.id === 2);
        expect(bkash.balance).toBe(10000);

        // 3. Customer Wallet refunded: 1500 + 1500 = 3000
        const customer = state.customers.find(c => c.id === 10);
        expect(customer.wallet_balance).toBe(3000);

        // 4. Customer Due reversed: 5000 - 3500 = 1500
        expect(customer.receivable_balance).toBe(1500);

        // 5. Account refund entries logged
        expect(state.accountTransactions).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ account_id: 1, type: 'refund', amount: 2000 }),
                expect.objectContaining({ account_id: 2, type: 'refund', amount: 3000 }),
            ])
        );

        // 6. Wallet refund entry logged
        expect(state.walletTransactions).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ party_type: 'customer', party_id: 10, amount: 1500, credit: true }),
            ])
        );
    });
});
