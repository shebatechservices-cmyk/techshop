// Comprehensive Unit & Integration Test Suite for Centralized Multi-Entity Wallet System
jest.mock('../config/db', () => {
    const { createPoolMock } = require('./mocks/poolMock');
    return createPoolMock();
});

const pool = require('../config/db');
const walletService = require('../services/walletService');
const walletController = require('../controllers/walletController');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('Centralized Multi-Entity Wallet System (Customer, Supplier, Staff)', () => {
    const setupLiveMock = (initialState = {}) => {
        const state = {
            wallets: initialState.wallets || [
                { id: 1, entity_type: 'customer', entity_id: 10, entity_name: 'Customer 10', balance: 2000 },
                { id: 2, entity_type: 'supplier', entity_id: 20, entity_name: 'Supplier 20', balance: 5000 },
                { id: 3, entity_type: 'staff', entity_id: 30, entity_name: 'Staff 30', balance: 1000 },
            ],
            paymentAccounts: initialState.paymentAccounts || [
                { id: 1, name: 'Main Cash Drawer', account_type: 'drawer', balance: 10000 },
                { id: 2, name: 'bKash Merchant', account_type: 'mfs', balance: 25000 },
            ],
            customers: initialState.customers || [
                { id: 10, name: 'Customer 10', wallet_balance: 2000, receivable_balance: 1500 }
            ],
            suppliers: initialState.suppliers || [
                { id: 20, name: 'Supplier 20', wallet_balance: 5000, payable_balance: 3000 }
            ],
            users: initialState.users || [
                { id: 30, name: 'Staff 30', wallet_balance: 1000 }
            ],
            walletTransactions: [],
            accountTransactions: [],
        };

        const client = {
            query: jest.fn(async (sql, params = []) => {
                const queryStr = typeof sql === 'string' ? sql : sql.text;

                if (/BEGIN|COMMIT|ROLLBACK/i.test(queryStr)) {
                    return { rows: [], rowCount: 0 };
                }
                if (/ALTER TABLE|CREATE TABLE|CREATE SEQUENCE/i.test(queryStr)) {
                    return { rows: [], rowCount: 0 };
                }

                // Wallets query
                if (/SELECT \* FROM wallets WHERE entity_type = \$1 AND entity_id = \$2/i.test(queryStr)) {
                    const w = state.wallets.find(x => x.entity_type === params[0] && x.entity_id === Number(params[1]));
                    return { rows: w ? [w] : [] };
                }
                if (/INSERT INTO wallets/i.test(queryStr)) {
                    const w = { id: state.wallets.length + 1, entity_type: params[0], entity_id: params[1], entity_name: params[2], balance: Number(params[3] || 0) };
                    state.wallets.push(w);
                    return { rows: [w] };
                }
                if (/UPDATE wallets SET balance = \$1/i.test(queryStr)) {
                    const w = state.wallets.find(x => x.id === Number(params[1]));
                    if (w) w.balance = Number(params[0]);
                    return { rows: [] };
                }

                // Entity balance queries
                if (/SELECT .* FROM customers WHERE id = \$1/i.test(queryStr)) {
                    const c = state.customers.find(x => x.id === Number(params[0]));
                    return { rows: c ? [{ ...c, rb: c.receivable_balance }] : [] };
                }
                if (/SELECT .* FROM suppliers WHERE id = \$1/i.test(queryStr)) {
                    const s = state.suppliers.find(x => x.id === Number(params[0]));
                    return { rows: s ? [{ ...s, pb: s.payable_balance }] : [] };
                }
                if (/SELECT .* FROM users WHERE id = \$1/i.test(queryStr)) {
                    const u = state.users.find(x => x.id === Number(params[0]));
                    return { rows: u ? [u] : [] };
                }

                // Entity balance updates
                if (/UPDATE customers SET wallet_balance = \$1 WHERE id = \$2/i.test(queryStr)) {
                    const c = state.customers.find(x => x.id === Number(params[1]));
                    if (c) c.wallet_balance = Number(params[0]);
                    return { rows: [] };
                }
                if (/UPDATE suppliers SET wallet_balance = \$1 WHERE id = \$2/i.test(queryStr)) {
                    const s = state.suppliers.find(x => x.id === Number(params[1]));
                    if (s) s.wallet_balance = Number(params[0]);
                    return { rows: [] };
                }
                if (/UPDATE users SET wallet_balance = \$1 WHERE id = \$2/i.test(queryStr)) {
                    const u = state.users.find(x => x.id === Number(params[1]));
                    if (u) u.wallet_balance = Number(params[0]);
                    return { rows: [] };
                }
                if (/UPDATE customers SET receivable_balance = GREATEST\(0, COALESCE\(receivable_balance, 0\) - \$1\)/i.test(queryStr)) {
                    const c = state.customers.find(x => x.id === Number(params[1]));
                    if (c) c.receivable_balance = Math.max(0, c.receivable_balance - Number(params[0]));
                    return { rows: [] };
                }

                // Payment accounts
                if (/SELECT \* FROM payment_accounts WHERE id = \$1/i.test(queryStr) || /SELECT id, name, account_type, balance FROM payment_accounts WHERE id = \$1/i.test(queryStr)) {
                    const a = state.paymentAccounts.find(x => x.id === Number(params[0]));
                    return { rows: a ? [a] : [] };
                }
                if (/FROM payment_accounts/i.test(queryStr)) {
                    return { rows: state.paymentAccounts };
                }
                if (/UPDATE payment_accounts SET balance = balance \+ \$1 WHERE id = \$2/i.test(queryStr)) {
                    const a = state.paymentAccounts.find(x => x.id === Number(params[1]));
                    if (a) a.balance += Number(params[0]);
                    return { rows: [] };
                }
                if (/UPDATE payment_accounts SET balance = GREATEST\(0, balance - \$1\) WHERE id = \$2/i.test(queryStr)) {
                    const a = state.paymentAccounts.find(x => x.id === Number(params[1]));
                    if (a) a.balance = Math.max(0, a.balance - Number(params[0]));
                    return { rows: [] };
                }

                // Ledger inserts
                if (/INSERT INTO account_transactions/i.test(queryStr)) {
                    const tx = { account_id: params[0], type: params[1], amount: params[2], reference: params[3], note: params[4] };
                    state.accountTransactions.push(tx);
                    return { rows: [tx] };
                }
                if (/INSERT INTO wallet_transactions/i.test(queryStr)) {
                    const wt = {
                        id: state.walletTransactions.length + 1,
                        wallet_id: params[0],
                        entity_type: params[1],
                        entity_id: params[2],
                        party_type: params[4],
                        party_id: params[5],
                        type: params[7],
                        amount: params[8],
                        credit: params[9],
                        account_id: params[10],
                        account_effect: params[12],
                        cash_drawer_effect: params[13],
                        reference_type: params[14],
                        reference_id: params[15],
                        balance_before: params[18],
                        balance_after: params[19],
                    };
                    state.walletTransactions.push(wt);
                    return { rows: [wt] };
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

    // --- A. CUSTOMER WALLET TESTS ---
    describe('Customer Wallet Rules', () => {
        test('Customer Top-up: (+) Cash Drawer, (+) Customer Wallet', async () => {
            const { client, state } = setupLiveMock();
            const res = await walletService.executeWalletTransaction(client, {
                entityType: 'customer',
                entityId: 10,
                action: 'topup',
                amount: 1000,
                accountId: 1, // Main Cash Drawer
                referenceId: 'TOP-101',
            });

            expect(res.wallet.balance).toBe(3000); // 2000 + 1000
            expect(state.paymentAccounts.find(a => a.id === 1).balance).toBe(11000); // 10000 + 1000
            expect(state.customers.find(c => c.id === 10).wallet_balance).toBe(3000);
            expect(state.accountTransactions).toEqual(
                expect.arrayContaining([expect.objectContaining({ account_id: 1, type: 'deposit', amount: 1000 })])
            );
        });

        test('Customer Checkout / POS Sale: Drawer UNCHANGED, (-) Customer Wallet', async () => {
            const { client, state } = setupLiveMock();
            const res = await walletService.executeWalletTransaction(client, {
                entityType: 'customer',
                entityId: 10,
                action: 'checkout',
                amount: 500,
                referenceId: 'INV-2026-001',
            });

            expect(res.wallet.balance).toBe(1500); // 2000 - 500
            expect(state.paymentAccounts.find(a => a.id === 1).balance).toBe(10000); // Drawer unchanged
            expect(state.customers.find(c => c.id === 10).wallet_balance).toBe(1500);
        });

        test('Customer Overdraft Check: throws when deduction exceeds wallet balance', async () => {
            const { client } = setupLiveMock();
            await expect(walletService.executeWalletTransaction(client, {
                entityType: 'customer',
                entityId: 10,
                action: 'checkout',
                amount: 9999, // Exceeds 2000
            })).rejects.toThrow(/Insufficient wallet balance/);
        });

        test('Customer Settle Due: Drawer UNCHANGED, (-) Customer Wallet, (-) Customer Due', async () => {
            const { client, state } = setupLiveMock();
            const res = await walletService.executeWalletTransaction(client, {
                entityType: 'customer',
                entityId: 10,
                action: 'due_settle',
                amount: 800,
                referenceId: 'SETTLE-01',
            });

            expect(res.wallet.balance).toBe(1200); // 2000 - 800
            expect(state.customers.find(c => c.id === 10).receivable_balance).toBe(700); // 1500 - 800
            expect(state.paymentAccounts.find(a => a.id === 1).balance).toBe(10000); // Drawer unchanged
        });

        test('Customer Cash Refund / Withdrawal: (-) Cash Drawer, (-) Customer Wallet', async () => {
            const { client, state } = setupLiveMock();
            const res = await walletService.executeWalletTransaction(client, {
                entityType: 'customer',
                entityId: 10,
                action: 'withdraw',
                amount: 500,
                accountId: 1, // Main Cash Drawer
                referenceId: 'REF-01',
            });

            expect(res.wallet.balance).toBe(1500); // 2000 - 500
            expect(state.paymentAccounts.find(a => a.id === 1).balance).toBe(9500); // 10000 - 500
            expect(state.customers.find(c => c.id === 10).wallet_balance).toBe(1500);
            expect(state.accountTransactions).toEqual(
                expect.arrayContaining([expect.objectContaining({ account_id: 1, type: 'withdraw', amount: 500 })])
            );
        });
    });

    // --- B. SUPPLIER WALLET TESTS ---
    describe('Supplier Wallet Rules', () => {
        test('Supplier Advance Paid: (-) Cash Drawer, (+) Supplier Advance Wallet', async () => {
            const { client, state } = setupLiveMock();
            const res = await walletService.executeWalletTransaction(client, {
                entityType: 'supplier',
                entityId: 20,
                action: 'advance_paid',
                amount: 2000,
                accountId: 1, // Main Cash Drawer
                referenceId: 'ADV-SUP-01',
            });

            expect(res.wallet.balance).toBe(7000); // 5000 + 2000
            expect(state.paymentAccounts.find(a => a.id === 1).balance).toBe(8000); // 10000 - 2000
            expect(state.suppliers.find(s => s.id === 20).wallet_balance).toBe(7000);
        });

        test('Supplier Purchase Settle: Drawer UNCHANGED, (-) Supplier Wallet', async () => {
            const { client, state } = setupLiveMock();
            const res = await walletService.executeWalletTransaction(client, {
                entityType: 'supplier',
                entityId: 20,
                action: 'purchase_settle',
                amount: 1500,
                referenceId: 'PO-2026-001',
            });

            expect(res.wallet.balance).toBe(3500); // 5000 - 1500
            expect(state.paymentAccounts.find(a => a.id === 1).balance).toBe(10000); // Drawer unchanged
            expect(state.suppliers.find(s => s.id === 20).wallet_balance).toBe(3500);
        });

        test('Supplier Refund: (+) Cash Drawer, (-) Supplier Wallet', async () => {
            const { client, state } = setupLiveMock();
            const res = await walletService.executeWalletTransaction(client, {
                entityType: 'supplier',
                entityId: 20,
                action: 'supplier_refund',
                amount: 1000,
                accountId: 1, // Main Cash Drawer
                referenceId: 'SUP-REF-01',
            });

            expect(res.wallet.balance).toBe(4000); // 5000 - 1000
            expect(state.paymentAccounts.find(a => a.id === 1).balance).toBe(11000); // 10000 + 1000
            expect(state.suppliers.find(s => s.id === 20).wallet_balance).toBe(4000);
        });
    });

    // --- C. STAFF WALLET TESTS ---
    describe('Staff Wallet Rules', () => {
        test('Staff Top-up: (+) Cash Drawer, (+) Staff Wallet', async () => {
            const { client, state } = setupLiveMock();
            const res = await walletService.executeWalletTransaction(client, {
                entityType: 'staff',
                entityId: 30,
                action: 'topup',
                amount: 500,
                accountId: 1, // Main Cash Drawer
                referenceId: 'STAFF-TOP-01',
            });

            expect(res.wallet.balance).toBe(1500); // 1000 + 500
            expect(state.paymentAccounts.find(a => a.id === 1).balance).toBe(10500); // 10000 + 500
            expect(state.users.find(u => u.id === 30).wallet_balance).toBe(1500);
        });

        test('Staff Salary Accrual: Drawer UNCHANGED, (+) Staff Wallet', async () => {
            const { client, state } = setupLiveMock();
            const res = await walletService.executeWalletTransaction(client, {
                entityType: 'staff',
                entityId: 30,
                action: 'salary_accrual',
                amount: 15000,
                referenceId: 'SAL-SEP-2026',
            });

            expect(res.wallet.balance).toBe(16000); // 1000 + 15000
            expect(state.paymentAccounts.find(a => a.id === 1).balance).toBe(10000); // Drawer unchanged
            expect(state.users.find(u => u.id === 30).wallet_balance).toBe(16000);
        });

        test('Staff Internal Purchase: Drawer UNCHANGED, (-) Staff Wallet', async () => {
            const { client, state } = setupLiveMock();
            const res = await walletService.executeWalletTransaction(client, {
                entityType: 'staff',
                entityId: 30,
                action: 'internal_purchase',
                amount: 400,
                referenceId: 'STAFF-BUY-01',
            });

            expect(res.wallet.balance).toBe(600); // 1000 - 400
            expect(state.paymentAccounts.find(a => a.id === 1).balance).toBe(10000); // Drawer unchanged
            expect(state.users.find(u => u.id === 30).wallet_balance).toBe(600);
        });

        test('Staff Cash Payout / Withdrawal: (-) Cash Drawer, (-) Staff Wallet', async () => {
            const { client, state } = setupLiveMock();
            const res = await walletService.executeWalletTransaction(client, {
                entityType: 'staff',
                entityId: 30,
                action: 'withdraw',
                amount: 700,
                accountId: 1, // Main Cash Drawer
                referenceId: 'STAFF-PAYOUT-01',
            });

            expect(res.wallet.balance).toBe(300); // 1000 - 700
            expect(state.paymentAccounts.find(a => a.id === 1).balance).toBe(9300); // 10000 - 700
            expect(state.users.find(u => u.id === 30).wallet_balance).toBe(300);
            expect(state.accountTransactions).toEqual(
                expect.arrayContaining([expect.objectContaining({ account_id: 1, type: 'withdraw', amount: 700 })])
            );
        });
    });

    // --- D. CONTROLLER ROUTE TESTS ---
    describe('Wallet Controller Routes', () => {
        test('postWalletTransaction: executes atomic transaction via controller', async () => {
            setupLiveMock();
            const req = {
                body: {
                    entity_type: 'customer',
                    entity_id: 10,
                    action: 'topup',
                    amount: 500,
                    account_id: 1,
                    reference: 'TOP-CTRL-01',
                }
            };
            const res = mockRes();
            await walletController.postWalletTransaction(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });
});
