const { validateSaleDiscountAndCost } = require('../../controllers/sales/order/update/salesUpdateValidation');
const { processCustomerTransaction } = require('../../controllers/party/transactions/customerTransactionProcessor');
const { processSupplierTransaction } = require('../../controllers/party/transactions/supplierTransactionProcessor');
const { payDueViaWallet } = require('../../controllers/accounts/transfer/accountDueSettlementController');

describe('Sales Discount & Due Overpayment Validations', () => {
    describe('Backend: validateSaleDiscountAndCost', () => {
        const mockClient = {
            query: jest.fn().mockImplementation((text, params) => {
                if (/FROM products WHERE id/i.test(text)) {
                    return Promise.resolve({
                        rows: [{ id: 101, name: 'SSD 512GB', purchase_price: 3000 }],
                    });
                }
                return Promise.resolve({ rows: [] });
            }),
        };

        test('rejects discount that exceeds prior paid amount on edit', async () => {
            const sale = { id: 1, paid_amount: 1500, due_amount: 500 };
            const itemsList = [{ product_id: 101, unit_price: 4000, quantity: 1, discount: 0, cost_price: 3000 }];

            await expect(
                validateSaleDiscountAndCost(mockClient, {
                    sale,
                    itemsList,
                    subtotal: 4000,
                    discount: 2000,
                })
            ).rejects.toThrow(/ইনভয়েসের পরিশোধিত পরিমাণ/);
        });

        test('rejects item discount when selling price drops below purchase cost', async () => {
            const sale = { id: 1, paid_amount: 5000, due_amount: 0 };
            const itemsList = [{ product_id: 101, unit_price: 3500, quantity: 1, discount: 800, cost_price: 3000 }];

            await expect(
                validateSaleDiscountAndCost(mockClient, {
                    sale,
                    itemsList,
                    subtotal: 3500,
                    discount: 800,
                })
            ).rejects.toThrow(/পারচেজ কস্ট .* এর চেয়ে কম হতে পারবে না/);
        });

        test('passes when discount is within paid amount and above purchase cost', async () => {
            const sale = { id: 1, paid_amount: 4000, due_amount: 0 };
            const itemsList = [{ product_id: 101, unit_price: 4000, quantity: 1, discount: 500, cost_price: 3000 }];

            await expect(
                validateSaleDiscountAndCost(mockClient, {
                    sale,
                    itemsList,
                    subtotal: 4000,
                    discount: 500,
                })
            ).resolves.not.toThrow();
        });
    });

    describe('Backend: Party Transactions Due Overpayment Guards', () => {
        test('customer due_receive rejects amount greater than receivable balance', async () => {
            const client = {
                query: jest.fn((text) => {
                    if (/SELECT id, name, receivable_balance FROM customers/i.test(text)) {
                        return Promise.resolve({ rows: [{ id: 5, name: 'Rahim', receivable_balance: 500 }] });
                    }
                    return Promise.resolve({ rows: [] });
                }),
            };

            await expect(
                processCustomerTransaction(client, {
                    party_id: 5,
                    action_type: 'due_receive',
                    account_id: 1,
                    numAmount: 1000,
                })
            ).rejects.toEqual(
                expect.objectContaining({
                    status: 400,
                    message: expect.stringMatching(/কাস্টমারের মোট বকেয়া/i),
                })
            );
        });

        test('supplier due_payment rejects amount greater than payable balance', async () => {
            const client = {
                query: jest.fn((text) => {
                    if (/SELECT id, name, payable_balance FROM suppliers/i.test(text)) {
                        return Promise.resolve({ rows: [{ id: 8, name: 'Dell Distro', payable_balance: 2000 }] });
                    }
                    return Promise.resolve({ rows: [] });
                }),
            };

            await expect(
                processSupplierTransaction(client, {
                    party_id: 8,
                    action_type: 'due_payment',
                    account_id: 1,
                    numAmount: 2500,
                })
            ).rejects.toEqual(
                expect.objectContaining({
                    status: 400,
                    message: expect.stringMatching(/সাপ্লায়ারের মোট বকেয়া/i),
                })
            );
        });
    });

    describe('Backend: payDueViaWallet Overpayment Safeguards', () => {
        const pool = require('../../config/db');

        test('rejects customer wallet due payment when amount exceeds receivable balance', async () => {
            const mockClient = {
                query: jest.fn((text) => {
                    if (/BEGIN|ROLLBACK/i.test(text)) return Promise.resolve({ rows: [] });
                    if (/SELECT balance FROM payment_accounts/i.test(text)) {
                        return Promise.resolve({ rows: [{ balance: 10000 }] });
                    }
                    if (/SELECT receivable_balance FROM customers/i.test(text)) {
                        return Promise.resolve({ rows: [{ receivable_balance: 300 }] });
                    }
                    return Promise.resolve({ rows: [] });
                }),
                release: jest.fn(),
            };
            jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

            const req = {
                body: { account_id: 1, party_type: 'customer', party_id: 12, amount: 500 },
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };

            await payDueViaWallet(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringMatching(/cannot exceed customer's due/i),
                })
            );
        });
    });
});
