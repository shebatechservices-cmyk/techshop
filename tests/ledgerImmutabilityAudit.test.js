/**
 * Tests for Account Ledger Immutability & Audit Trail Integrity
 */

// In-memory mock database state
const mockState = {
    paymentAccounts: [
        { id: 1, name: 'Cash in Hand (Counter Drawer)', account_type: 'drawer', balance: 50000 },
        { id: 2, name: 'bKash Merchant', account_type: 'bank', balance: 30000 }
    ],
    accountTransactions: [
        {
            id: 101,
            account_id: 1,
            type: 'deposit',
            transaction_type: 'credit',
            amount: 5000,
            balance_after: 50000,
            source_type: 'pos_sale',
            source_id: 'INV-2026-001',
            reference: 'INV-2026-001',
            note: 'POS Sale',
            transaction_id: null,
            created_by: 'Admin',
            created_at: new Date('2026-09-20T10:00:00Z').toISOString()
        },
        {
            id: 102,
            account_id: 2,
            type: 'withdraw',
            transaction_type: 'debit',
            amount: 2500,
            balance_after: 27500,
            source_type: 'expense',
            source_id: 'EXP-101',
            reference: 'EXP-101',
            note: 'Office Utility Bill',
            transaction_id: 'BKASH-BILL-01',
            created_by: 'Accountant',
            created_at: new Date('2026-09-20T11:00:00Z').toISOString()
        }
    ],
    wallets: [
        { id: 1, entity_type: 'customer', entity_id: 10, entity_name: 'Rahim Khan', balance: 4000 }
    ],
    walletTransactions: [
        {
            id: 501,
            wallet_id: 1,
            entity_type: 'customer',
            entity_id: 10,
            entity_name: 'Rahim Khan',
            party_type: 'customer',
            party_id: 10,
            party_name: 'Rahim Khan',
            type: 'deposit',
            amount: 2000,
            credit: true,
            account_id: 1,
            account_name: 'Cash in Hand (Counter Drawer)',
            account_effect: 'in',
            cash_drawer_effect: 'in',
            reference: 'WTX-DEP-01',
            note: 'Cash deposit to wallet',
            balance_before: 2000,
            balance_after: 4000,
            created_at: new Date('2026-09-20T12:00:00Z').toISOString()
        }
    ],
    customers: [
        { id: 10, name: 'Rahim Khan', wallet_balance: 4000, receivable_balance: 0 }
    ]
};

// Mock Database Pool
jest.mock('../config/db', () => {
    return {
        query: jest.fn(async (sql, params = []) => {
            const lower = sql.toLowerCase();

            if (lower.includes('select * from account_transactions where id = $1')) {
                const tx = mockState.accountTransactions.find(t => t.id === Number(params[0]));
                return { rows: tx ? [tx] : [] };
            }

            if (lower.includes('select * from payment_accounts where id = $1')) {
                const acc = mockState.paymentAccounts.find(a => a.id === Number(params[0]));
                return { rows: acc ? [acc] : [] };
            }

            if (lower.includes('select * from wallet_transactions where id = $1')) {
                const wtx = mockState.walletTransactions.find(t => t.id === Number(params[0]));
                return { rows: wtx ? [wtx] : [] };
            }

            if (lower.includes('select * from wallets where entity_type = $1 and entity_id = $2')) {
                const w = mockState.wallets.find(w => w.entity_type === params[0] && w.entity_id === Number(params[1]));
                return { rows: w ? [w] : [] };
            }

            if (lower.includes('select * from customers where id = $1')) {
                const c = mockState.customers.find(c => c.id === Number(params[0]));
                return { rows: c ? [c] : [] };
            }

            return { rows: [] };
        }),
        connect: jest.fn(async () => {
            return {
                query: jest.fn(async (sql, params = []) => {
                    const lower = sql.toLowerCase();

                    if (lower.includes('begin') || lower.includes('commit') || lower.includes('rollback')) {
                        return { rows: [] };
                    }

                    if (lower.includes('alter table') || lower.includes('create table')) {
                        return { rows: [] };
                    }

                    if (lower.includes('select * from account_transactions where id = $1')) {
                        const tx = mockState.accountTransactions.find(t => t.id === Number(params[0]));
                        return { rows: tx ? [tx] : [] };
                    }

                    if (lower.includes('select id, name, account_type, balance from payment_accounts where id = $1')) {
                        const acc = mockState.paymentAccounts.find(a => a.id === Number(params[0]));
                        return { rows: acc ? [acc] : [] };
                    }

                    if (lower.includes('select * from payment_accounts where id = $1')) {
                        const acc = mockState.paymentAccounts.find(a => a.id === Number(params[0]));
                        return { rows: acc ? [acc] : [] };
                    }

                    if (lower.includes('update payment_accounts set balance = balance + $1 where id = $2')) {
                        const acc = mockState.paymentAccounts.find(a => a.id === Number(params[1]));
                        if (acc) acc.balance += Number(params[0]);
                        return { rows: [] };
                    }

                    if (lower.includes('update payment_accounts set balance = greatest(0, balance - $1) where id = $2')) {
                        const acc = mockState.paymentAccounts.find(a => a.id === Number(params[1]));
                        if (acc) acc.balance = Math.max(0, acc.balance - Number(params[0]));
                        return { rows: [] };
                    }

                    if (lower.includes('insert into account_transactions')) {
                        const newId = mockState.accountTransactions.length + 200;
                        const newTx = {
                            id: newId,
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
                            created_at: new Date().toISOString()
                        };
                        mockState.accountTransactions.push(newTx);
                        return { rows: [newTx] };
                    }

                    if (lower.includes('select * from wallet_transactions where id = $1')) {
                        const wtx = mockState.walletTransactions.find(t => t.id === Number(params[0]));
                        return { rows: wtx ? [wtx] : [] };
                    }

                    if (lower.includes('select * from wallets where entity_type = $1 and entity_id = $2')) {
                        const w = mockState.wallets.find(w => w.entity_type === params[0] && w.entity_id === Number(params[1]));
                        return { rows: w ? [w] : [] };
                    }

                    if (lower.includes('select id, name, coalesce(wallet_balance, 0) as balance from customers where id = $1')) {
                        const c = mockState.customers.find(c => c.id === Number(params[0]));
                        return { rows: c ? [{ id: c.id, name: c.name, balance: c.wallet_balance }] : [] };
                    }

                    if (lower.includes('update wallets set balance = $1')) {
                        const w = mockState.wallets.find(w => w.id === Number(params[1]));
                        if (w) w.balance = Number(params[0]);
                        return { rows: [] };
                    }

                    if (lower.includes('update customers set wallet_balance = $1 where id = $2')) {
                        const c = mockState.customers.find(c => c.id === Number(params[1]));
                        if (c) c.wallet_balance = Number(params[0]);
                        return { rows: [] };
                    }

                    if (lower.includes('insert into wallet_transactions')) {
                        const newWtx = {
                            id: mockState.walletTransactions.length + 600,
                            wallet_id: params[0],
                            entity_type: params[1],
                            entity_id: params[2],
                            entity_name: params[3],
                            party_type: params[4],
                            party_id: params[5],
                            party_name: params[6],
                            type: params[7],
                            amount: Number(params[8]),
                            credit: params[9],
                            account_id: params[10],
                            account_name: params[11],
                            account_effect: params[12],
                            cash_drawer_effect: params[13],
                            reference_type: params[14],
                            reference_id: params[15],
                            reference: params[16],
                            note: params[17],
                            balance_before: Number(params[18]),
                            balance_after: Number(params[19]),
                            created_at: new Date().toISOString()
                        };
                        mockState.walletTransactions.push(newWtx);
                        return { rows: [newWtx] };
                    }

                    return { rows: [] };
                }),
                release: jest.fn()
            };
        })
    };
});

const accountController = require('../controllers/accountController');
const walletController = require('../controllers/walletController');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('Account Ledger Immutability & Audit Trail Integrity', () => {

    test('1. PUT /api/accounts/transactions/:id is strictly forbidden (403)', async () => {
        const req = {
            params: { id: 101 },
            body: { amount: 9999, note: 'Tampered note' }
        };
        const res = mockRes();

        await accountController.updateTransaction(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: expect.stringContaining('strictly prohibited')
        }));

        // Confirm original record was NOT modified
        const origTx = mockState.accountTransactions.find(t => t.id === 101);
        expect(origTx.amount).toBe(5000);
        expect(origTx.note).toBe('POS Sale');
    });

    test('2. DELETE /api/accounts/transactions/:id is strictly forbidden (403)', async () => {
        const req = {
            params: { id: 101 }
        };
        const res = mockRes();

        await accountController.deleteTransaction(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: expect.stringContaining('strictly prohibited')
        }));

        // Confirm original record still exists
        const origTx = mockState.accountTransactions.find(t => t.id === 101);
        expect(origTx).toBeDefined();
    });

    test('3. PATCH /api/wallets/transaction/:id is strictly forbidden (403)', async () => {
        const req = {
            params: { id: 501 },
            body: { amount: 5000 }
        };
        const res = mockRes();

        await walletController.editWalletTransaction(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: expect.stringContaining('strictly prohibited')
        }));

        // Confirm wallet transaction amount untouched
        const origWtx = mockState.walletTransactions.find(t => t.id === 501);
        expect(origWtx.amount).toBe(2000);
    });

    test('4. POST /api/accounts/transactions/:id/reverse creates immutable offsetting entry with source_type cancellation_adjustment', async () => {
        const req = {
            params: { id: 101 }, // Original credit transaction of ৳ 5000
            body: {
                reason: 'Customer returned item; invoice cancelled',
                transaction_id: 'REV-POS-01'
            },
            user: { name: 'Store Manager' }
        };
        const res = mockRes();

        await accountController.reverseTransaction(req, res);

        expect(res.status).toHaveBeenCalledWith(200);

        // Account balance should be deducted by 5000 (50000 - 5000 = 45000)
        const updatedDrawer = mockState.paymentAccounts.find(a => a.id === 1);
        expect(updatedDrawer.balance).toBe(45000);

        // Original transaction remains unchanged
        const origTx = mockState.accountTransactions.find(t => t.id === 101);
        expect(origTx.amount).toBe(5000);
        expect(origTx.transaction_type).toBe('credit');

        // New reversal entry appended
        const revTx = mockState.accountTransactions.find(t => t.source_type === 'cancellation_adjustment' && t.source_id === '101');
        expect(revTx).toBeDefined();
        expect(revTx.transaction_type).toBe('debit');
        expect(revTx.type).toBe('debit_reverse');
        expect(revTx.amount).toBe(5000);
        expect(revTx.balance_after).toBe(45000);
        expect(revTx.reference).toBe('REV-INV-2026-001');
        expect(revTx.note).toBe('Reversal: Customer returned item; invoice cancelled');
        expect(revTx.created_by).toBe('Store Manager');
    });

    test('5. Reversing a debit transaction creates offsetting credit entry and restores running balance', async () => {
        const req = {
            params: { id: 102 }, // Original debit transaction of ৳ 2500
            body: {
                reason: 'Expense voucher voided due to billing error',
            },
            user: { name: 'Head Accountant' }
        };
        const res = mockRes();

        await accountController.reverseTransaction(req, res);

        expect(res.status).toHaveBeenCalledWith(200);

        // Bank balance should increase by 2500 (30000 + 2500 = 32500)
        const updatedBank = mockState.paymentAccounts.find(a => a.id === 2);
        expect(updatedBank.balance).toBe(32500);

        // Offsetting reversal entry
        const revTx = mockState.accountTransactions.find(t => t.source_type === 'cancellation_adjustment' && t.source_id === '102');
        expect(revTx).toBeDefined();
        expect(revTx.transaction_type).toBe('credit');
        expect(revTx.type).toBe('credit_reverse');
        expect(revTx.amount).toBe(2500);
        expect(revTx.balance_after).toBe(32500);
        expect(revTx.reference).toBe('REV-EXP-101');
    });

    test('6. Wallet transaction reversal creates offsetting ledger entry and preserves audit trail', async () => {
        const req = {
            params: { id: 501 }
        };
        const res = mockRes();

        await walletController.deleteWalletTransaction(req, res);

        expect(res.status).toHaveBeenCalledWith(200);

        // Wallet balance reduced from 4000 to 2000
        const cust = mockState.customers.find(c => c.id === 10);
        expect(cust.wallet_balance).toBe(2000);

        // Reversal wallet transaction appended
        const revWtx = mockState.walletTransactions.find(t => t.type === 'debit_reverse');
        expect(revWtx).toBeDefined();
        expect(revWtx.amount).toBe(2000);
        expect(revWtx.balance_after).toBe(2000);
        expect(revWtx.reference_type).toBe('cancellation_adjustment');

        // Account transaction appended for physical cash drawer reversal
        const accRevTx = mockState.accountTransactions.find(t => t.source_type === 'cancellation_adjustment' && t.source_id === '501');
        expect(accRevTx).toBeDefined();
        expect(accRevTx.transaction_type).toBe('debit');
        expect(accRevTx.amount).toBe(2000);
    });
});
