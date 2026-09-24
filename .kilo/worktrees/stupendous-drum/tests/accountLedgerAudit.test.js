// Test suite for Central Account Ledger Recording Audit
jest.mock('../config/db', () => {
    const { createPoolMock } = require('./mocks/poolMock');
    return createPoolMock();
});

const pool = require('../config/db');
const { ensureAccountLedgerSchema, recordAccountTransaction } = require('../services/accountLedgerService');
const accountController = require('../controllers/accountController');
const walletController = require('../controllers/walletController');
const expenseController = require('../controllers/expenseController');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('Central Account Ledger Recording & Audit Suite', () => {
    let state;
    let client;

    beforeEach(() => {
        state = {
            paymentAccounts: [
                { id: 1, name: 'Main Cash Drawer', account_type: 'drawer', balance: 10000 },
                { id: 2, name: 'bKash Merchant', account_type: 'mfs', balance: 25000, account_number: '01700000000' },
                { id: 3, name: 'City Bank AC', account_type: 'bank', balance: 100000, account_number: '123456789' },
            ],
            customers: [
                { id: 10, name: 'Customer Rahim', wallet_balance: 5000, receivable_balance: 2000 }
            ],
            suppliers: [
                { id: 20, name: 'Supplier Karim', wallet_balance: 3000, payable_balance: 15000 }
            ],
            wallets: [
                { id: 1, entity_type: 'customer', entity_id: 10, entity_name: 'Customer Rahim', balance: 5000, status: 'active' },
                { id: 2, entity_type: 'supplier', entity_id: 20, entity_name: 'Supplier Karim', balance: 3000, status: 'active' },
            ],
            expenses: [],
            accountTransactions: [],
            walletTransactions: [],
        };

        client = {
            query: jest.fn(async (sql, params = []) => {
                const queryStr = typeof sql === 'string' ? sql : sql.text;

                if (/BEGIN|COMMIT|ROLLBACK/i.test(queryStr)) {
                    return { rows: [], rowCount: 0 };
                }
                if (/ALTER TABLE|CREATE TABLE|CREATE SEQUENCE/i.test(queryStr)) {
                    return { rows: [], rowCount: 0 };
                }

                // SELECT payment_accounts (FOR UPDATE or regular)
                if (/SELECT.*FROM payment_accounts WHERE id = \$1/i.test(queryStr)) {
                    const accId = Number(params[0]);
                    const found = state.paymentAccounts.find(a => a.id === accId);
                    return { rows: found ? [{ ...found }] : [], rowCount: found ? 1 : 0 };
                }

                // UPDATE payment_accounts balance
                // UPDATE payment_accounts balance
                if (/UPDATE payment_accounts SET balance = balance \+ \$1 WHERE id = \$2/i.test(queryStr)) {
                    const addAmt = Number(params[0]);
                    const accId = Number(params[1]);
                    const acc = state.paymentAccounts.find(a => a.id === accId);
                    if (acc) acc.balance += addAmt;
                    return { rows: acc ? [{ ...acc }] : [], rowCount: acc ? 1 : 0 };
                }
                if (/UPDATE payment_accounts SET balance = GREATEST\(0, balance - \$1\) WHERE id = \$2/i.test(queryStr)) {
                    const subAmt = Number(params[0]);
                    const accId = Number(params[1]);
                    const acc = state.paymentAccounts.find(a => a.id === accId);
                    if (acc) acc.balance = Math.max(0, acc.balance - subAmt);
                    return { rows: acc ? [{ ...acc }] : [], rowCount: acc ? 1 : 0 };
                }
                if (/UPDATE payment_accounts SET balance = \$1 WHERE id = \$2/i.test(queryStr)) {
                    const newBal = Number(params[0]);
                    const accId = Number(params[1]);
                    const acc = state.paymentAccounts.find(a => a.id === accId);
                    if (acc) acc.balance = newBal;
                    return { rows: acc ? [{ ...acc }] : [], rowCount: acc ? 1 : 0 };
                }

                // INSERT INTO account_transactions
                if (/INSERT INTO account_transactions/i.test(queryStr)) {
                    const id = state.accountTransactions.length + 1;
                    const row = {
                        id,
                        account_id: params[0],
                        type: params[1],
                        amount: Number(params[2]),
                        reference: params[3],
                        note: params[4],
                        transaction_type: params[5],
                        balance_after: Number(params[6]),
                        source_type: params[7],
                        source_id: params[8],
                        transaction_id: params[9],
                        created_by: params[10],
                        created_at: new Date().toISOString(),
                    };
                    state.accountTransactions.push(row);
                    return { rows: [row], rowCount: 1 };
                }

                // SELECT FROM account_transactions
                if (/account_transactions/i.test(queryStr) && /SELECT/i.test(queryStr)) {
                    const rows = state.accountTransactions.map(t => {
                        const acc = state.paymentAccounts.find(a => a.id === t.account_id);
                        return { ...t, account_name: acc ? acc.name : 'Unknown', account_type: acc ? acc.account_type : 'drawer' };
                    });
                    return { rows, rowCount: rows.length };
                }

                // SELECT FROM wallets
                if (/SELECT.*FROM wallets WHERE entity_type = \$1 AND entity_id = \$2/i.test(queryStr)) {
                    const w = state.wallets.find(w => w.entity_type === params[0] && w.entity_id === Number(params[1]));
                    return { rows: w ? [{ ...w }] : [], rowCount: w ? 1 : 0 };
                }

                // UPDATE wallets
                if (/UPDATE wallets SET balance = \$1/i.test(queryStr)) {
                    const newBal = Number(params[0]);
                    const wId = Number(params[1]);
                    const w = state.wallets.find(w => w.id === wId);
                    if (w) w.balance = newBal;
                    return { rows: [], rowCount: 1 };
                }

                // INSERT INTO wallet_transactions
                if (/INSERT INTO wallet_transactions/i.test(queryStr)) {
                    const row = { id: state.walletTransactions.length + 1, type: params[7], amount: Number(params[8]) };
                    state.walletTransactions.push(row);
                    return { rows: [row], rowCount: 1 };
                }

                // UPDATE customers
                if (/UPDATE customers SET/i.test(queryStr)) {
                    return { rows: [], rowCount: 1 };
                }

                // UPDATE suppliers
                if (/UPDATE suppliers SET/i.test(queryStr)) {
                    return { rows: [], rowCount: 1 };
                }

                // INSERT INTO expenses
                if (/INSERT INTO expenses/i.test(queryStr)) {
                    const row = { id: 101, voucher_no: 'EXP-101', amount: Number(params[1]), account_id: Number(params[2]) };
                    state.expenses.push(row);
                    return { rows: [row], rowCount: 1 };
                }

                return { rows: [], rowCount: 0 };
            }),
            release: jest.fn(),
        };

        pool.connect = jest.fn().mockResolvedValue(client);
        pool.query = jest.fn(client.query);
    });

    test('1. recordAccountTransaction records credit inflow and updates running balance', async () => {
        const result = await recordAccountTransaction(client, {
            accountId: 1,
            transactionType: 'credit',
            type: 'deposit',
            amount: 2500,
            sourceType: 'pos_sale',
            sourceId: 'INV-1001',
            reference: 'INV-1001',
            note: 'POS sale payment via Cash Drawer',
            createdBy: 'Admin',
        });

        expect(result).toBeDefined();
        expect(result.account.balance).toBe(12500); // 10000 + 2500
        expect(result.transaction.balance_after).toBe(12500);
        expect(result.transaction.transaction_type).toBe('credit');
        expect(result.transaction.source_type).toBe('pos_sale');
        expect(result.transaction.source_id).toBe('INV-1001');
        expect(state.paymentAccounts.find(a => a.id === 1).balance).toBe(12500);
    });

    test('2. recordAccountTransaction records debit outflow and updates running balance', async () => {
        const result = await recordAccountTransaction(client, {
            accountId: 2,
            transactionType: 'debit',
            type: 'purchase_payment',
            amount: 5000,
            sourceType: 'purchase',
            sourceId: 'PO-5001',
            reference: 'PO-5001',
            note: 'Purchase bill payment via bKash',
            transactionId: 'TRX998877',
            createdBy: 'Staff',
        });

        expect(result).toBeDefined();
        expect(result.account.balance).toBe(20000); // 25000 - 5000
        expect(result.transaction.balance_after).toBe(20000);
        expect(result.transaction.transaction_type).toBe('debit');
        expect(result.transaction.source_type).toBe('purchase');
        expect(result.transaction.transaction_id).toBe('TRX998877');
        expect(state.paymentAccounts.find(a => a.id === 2).balance).toBe(20000);
    });

    test('3. Inter-account transfer records atomic debit on source and credit on destination', async () => {
        const req = {
            body: {
                from_wallet_id: 3, // City Bank (100,000)
                to_wallet_id: 1,   // Cash Drawer (10,000)
                amount: 15000,
                note: 'Cash replenishment from Bank',
                transaction_id: 'BNK-TX-1234',
            },
            user: { name: 'Accountant' }
        };
        const res = mockRes();

        await accountController.transferFunds(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(state.paymentAccounts.find(a => a.id === 3).balance).toBe(85000); // 100,000 - 15,000
        expect(state.paymentAccounts.find(a => a.id === 1).balance).toBe(25000); // 10,000 + 15,000

        const transferOutTx = state.accountTransactions.find(t => t.account_id === 3 && t.type === 'transfer_out');
        const transferInTx = state.accountTransactions.find(t => t.account_id === 1 && t.type === 'transfer_in');

        expect(transferOutTx).toBeDefined();
        expect(transferOutTx.transaction_type).toBe('debit');
        expect(transferOutTx.balance_after).toBe(85000);
        expect(transferOutTx.source_type).toBe('transfer');

        expect(transferInTx).toBeDefined();
        expect(transferInTx.transaction_type).toBe('credit');
        expect(transferInTx.balance_after).toBe(25000);
        expect(transferInTx.source_type).toBe('transfer');
    });

    test('4. Wallet deposit creates credit transaction with running balance and wallet metadata', async () => {
        const req = {
            body: {
                entity_type: 'customer',
                entity_id: 10,
                action: 'topup',
                amount: 2000,
                account_id: 2, // bKash
                transaction_id: 'BKASH-TOPUP-01',
                note: 'Rahim wallet topup via bKash',
            }
        };
        const res = mockRes();

        await walletController.postTopup(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(state.paymentAccounts.find(a => a.id === 2).balance).toBe(27000); // 25000 + 2000

        const topupTx = state.accountTransactions.find(t => t.account_id === 2 && t.source_type === 'wallet_deposit');
        expect(topupTx).toBeDefined();
        expect(topupTx.transaction_type).toBe('credit');
        expect(topupTx.amount).toBe(2000);
        expect(topupTx.balance_after).toBe(27000);
        expect(topupTx.transaction_id).toBe('BKASH-TOPUP-01');
    });

    test('5. Expense creation records debit account transaction with expense source_type', async () => {
        const req = {
            body: {
                category_name: 'Office Supplies',
                account_id: 1, // Cash Drawer
                amount: 1200,
                expense_date: '2026-09-21',
                payee_name: 'Stationery World',
                voucher_no: 'EXP-999',
                note: 'Printer ink and paper',
            },
            user: { name: 'Manager' }
        };
        const res = mockRes();

        await expenseController.createExpense(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(state.paymentAccounts.find(a => a.id === 1).balance).toBe(8800); // 10000 - 1200

        const expTx = state.accountTransactions.find(t => t.account_id === 1 && t.source_type === 'expense');
        expect(expTx).toBeDefined();
        expect(expTx.transaction_type).toBe('debit');
        expect(expTx.amount).toBe(1200);
        expect(expTx.balance_after).toBe(8800);
        expect(expTx.reference).toBe('EXP-999');
    });

    test('6. getTransactions returns complete chronological ledger with running balance', async () => {
        // Populate sample transaction
        state.accountTransactions.push({
            id: 1,
            account_id: 1,
            type: 'deposit',
            transaction_type: 'credit',
            amount: 5000,
            balance_after: 15000,
            source_type: 'pos_sale',
            source_id: 'INV-100',
            reference: 'INV-100',
            note: 'POS Sale',
            transaction_id: null,
            created_by: 'Admin',
            created_at: new Date().toISOString(),
        });

        const req = { query: { account_id: 'all', limit: '50' } };
        const res = mockRes();

        await accountController.getTransactions(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const data = res.json.mock.calls[0][0];
        expect(data.success).toBe(true);
        expect(data.data.length).toBeGreaterThan(0);
        expect(data.data[0].balance_after).toBeDefined();
        expect(data.data[0].transaction_type).toBeDefined();
    });
});
