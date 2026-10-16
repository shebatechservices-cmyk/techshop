jest.mock('../config/db', () => {
    const { createPoolMock } = require('./mocks/poolMock');
    return createPoolMock();
});

const {
    reconcilePurchaseOrderPayments,
} = require('../controllers/purchase/purchaseOrderUpdateHelpers');
const {
    resolvePaymentAccount,
} = require('../controllers/purchase/purchaseHelpers');

describe('Purchase Order Payment Safeguards & Anti-Reversal Policy', () => {
    describe('reconcilePurchaseOrderPayments policy safeguards', () => {
        it('bypasses reversal and re-tender when payment tenders are unchanged on PO edit', async () => {
            const queries = [];
            const mockClient = {
                query: jest.fn(async (sql, params = []) => {
                    queries.push({ sql: typeof sql === 'string' ? sql : sql.text, params });
                    if (/SELECT \* FROM purchase_order_payments/i.test(sql)) {
                        return {
                            rows: [
                                {
                                    id: 101,
                                    purchase_order_id: 55,
                                    payment_method: 'Bank',
                                    account_id: 11,
                                    amount: 100000.0,
                                    sub_option: 'IFIC ARUAIL BRANCH',
                                },
                            ],
                        };
                    }
                    return { rows: [], rowCount: 1 };
                }),
            };

            const po = {
                id: 55,
                po_number: 'PO-TEST-01',
                supplier_id: 9,
                total_paid: 100000.0,
            };

            const incomingPayments = [
                {
                    payment_method: 'Bank',
                    account_id: 11,
                    amount: 100000.0,
                    sub_option: 'IFIC ARUAIL BRANCH',
                },
            ];

            const result = await reconcilePurchaseOrderPayments(mockClient, {
                id: 55,
                po,
                payments: incomingPayments,
                targetSupplierId: 9,
                supplierName: 'Rakib Bhai',
                totalCost: 100000.0,
            });

            // Must NOT delete or reverse payments
            const deleteCalls = queries.filter(q => /DELETE FROM purchase_order_payments/i.test(q.sql));
            const reversalTxns = queries.filter(q => /purchase_payment_reversal/i.test(q.sql));
            expect(deleteCalls.length).toBe(0);
            expect(reversalTxns.length).toBe(0);

            // Balances must be preserved
            expect(result.totalPaid).toBe(100000.0);
            expect(result.newDue).toBe(0);
            expect(result.paymentStatus).toBe('PAID');
        });

        it('executes reversal and re-tender when payments are genuinely changed', async () => {
            const queries = [];
            const mockClient = {
                query: jest.fn(async (sql, params = []) => {
                    queries.push({ sql: typeof sql === 'string' ? sql : sql.text, params });
                    if (/SELECT \* FROM purchase_order_payments WHERE purchase_order_id = \$1 ORDER BY id ASC/i.test(sql)) {
                        return {
                            rows: [
                                {
                                    id: 101,
                                    purchase_order_id: 55,
                                    payment_method: 'Bank',
                                    account_id: 11,
                                    amount: 50000.0,
                                    sub_option: 'IFIC Bank',
                                },
                            ],
                        };
                    }
                    if (/SELECT \* FROM payment_accounts WHERE id = \$1/i.test(sql)) {
                        return { rows: [{ id: params[0], name: 'Account ' + params[0], balance: 200000 }] };
                    }
                    return { rows: [], rowCount: 1 };
                }),
            };

            const po = {
                id: 55,
                po_number: 'PO-TEST-02',
                supplier_id: 9,
                total_paid: 50000.0,
            };

            // New tenders have different amount
            const incomingPayments = [
                {
                    payment_method: 'Bank',
                    account_id: 11,
                    amount: 80000.0,
                    sub_option: 'IFIC Bank',
                },
            ];

            const result = await reconcilePurchaseOrderPayments(mockClient, {
                id: 55,
                po,
                payments: incomingPayments,
                targetSupplierId: 9,
                supplierName: 'Rakib Bhai',
                totalCost: 100000.0,
            });

            const deleteCalls = queries.filter(q => /DELETE FROM purchase_order_payments/i.test(q.sql));
            expect(deleteCalls.length).toBe(1);
            expect(result.totalPaid).toBe(80000.0);
            expect(result.newDue).toBe(20000.0);
            expect(result.paymentStatus).toBe('PARTIAL');
        });
    });

    describe('resolvePaymentAccount method-aware safeguards', () => {
        it('resolves bank account for Bank method without falling back to cash drawer', async () => {
            const mockClient = {
                query: jest.fn(async (sql) => {
                    if (/WHERE LOWER\(account_type\) = 'bank'/i.test(sql)) {
                        return { rows: [{ id: 11, name: 'IFIC ARUAIL BRANCH', account_type: 'bank' }] };
                    }
                    if (/account_type = 'drawer'/i.test(sql)) {
                        return { rows: [{ id: 1, name: 'Cash Drawer', account_type: 'drawer' }] };
                    }
                    return { rows: [] };
                }),
            };

            const account = await resolvePaymentAccount(mockClient, {
                payment_method: 'Bank Transfer',
                amount: 5000,
            });

            expect(account).toBeDefined();
            expect(account.id).toBe(11);
            expect(account.account_type).toBe('bank');
        });

        it('resolves MFS account for bKash method without falling back to cash drawer', async () => {
            const mockClient = {
                query: jest.fn(async (sql) => {
                    if (/IN \('mfs', 'mobile_banking'\)/i.test(sql)) {
                        return { rows: [{ id: 2, name: 'bKash Merchant', account_type: 'mfs' }] };
                    }
                    if (/account_type = 'drawer'/i.test(sql)) {
                        return { rows: [{ id: 1, name: 'Cash Drawer', account_type: 'drawer' }] };
                    }
                    return { rows: [] };
                }),
            };

            const account = await resolvePaymentAccount(mockClient, {
                payment_method: 'bKash',
                amount: 1500,
            });

            expect(account).toBeDefined();
            expect(account.id).toBe(2);
            expect(account.account_type).toBe('mfs');
        });
    });

    describe('Payload payments resolution safeguard logic', () => {
        it('preserves existing account_id and never overwrites with drawer', () => {
            const tenders = [
                {
                    isAccepted: true,
                    amount: 100000,
                    method: 'Bank',
                    account_id: 11,
                    sub_option: 'IFIC ARUAIL BRANCH',
                },
            ];

            const accountLabelToId = jest.fn(() => null);
            const walletAccounts = [
                { id: 1, name: 'Drawer', account_type: 'drawer' },
                { id: 11, name: 'IFIC ARUAIL BRANCH', account_type: 'bank' },
            ];

            const payments = tenders
                .filter((t) => t.isAccepted && Number(t.amount || 0) > 0)
                .map((t) => {
                    let resolvedAccId = t.account_id ? Number(t.account_id) : null;
                    if (!resolvedAccId && t.sub_option && accountLabelToId) {
                        const matchedId = accountLabelToId(t.sub_option);
                        if (matchedId) resolvedAccId = matchedId;
                    }
                    if (!resolvedAccId && walletAccounts && walletAccounts.length > 0) {
                        const meth = String(t.method || '').toLowerCase();
                        const matched = walletAccounts.find((a) => {
                            const accType = String(a.account_type || a.type || '').toLowerCase();
                            if (meth === 'bank') return accType === 'bank';
                            if (meth === 'mfs') return accType === 'mfs' || accType === 'mobile_banking';
                            if (meth === 'cash') return accType === 'cash' || accType === 'drawer';
                            return false;
                        });
                        resolvedAccId = matched ? matched.id : walletAccounts[0].id;
                    }
                    return {
                        payment_method: t.method || 'Cash',
                        account_id: resolvedAccId || 1,
                        amount: Number(t.amount || 0),
                    };
                });

            expect(payments).toHaveLength(1);
            expect(payments[0].account_id).toBe(11);
            expect(payments[0].payment_method).toBe('Bank');
            expect(accountLabelToId).not.toHaveBeenCalled();
        });
    });
});
