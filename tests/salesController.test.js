/**
 * Sales Controller Facade & Contract Tests
 *
 * Detailed subsystem test suites are modularized under tests/sales/:
 * - tests/sales/salesOrderCreate.test.js: createSale order validation, item persistence, serials & tenders
 * - tests/sales/salesOrderUpdate.test.js: updateSale stock reversals, pin checks, wallet balances
 * - tests/sales/salesOrderDelete.test.js: deleteSale soft-deletion, trash logs, drawer reversals
 * - tests/sales/salesExchange.test.js:    createExchangeSale exchange returns and replacements
 */

const sales = require('../controllers/salesController');

describe('salesController Facade Contract', () => {
    test('exposes all core sales order operations', () => {
        expect(typeof sales.createSale).toBe('function');
        expect(typeof sales.getSales).toBe('function');
        expect(typeof sales.getSaleById).toBe('function');
        expect(typeof sales.updateSale).toBe('function');
        expect(typeof sales.deleteSale).toBe('function');
    });

    test('exposes quotation operations', () => {
        expect(typeof sales.getQuotations).toBe('function');
        expect(typeof sales.getQuotationById).toBe('function');
        expect(typeof sales.createQuotation).toBe('function');
        expect(typeof sales.updateQuotation).toBe('function');
        expect(typeof sales.deleteQuotation).toBe('function');
        expect(typeof sales.updateQuotationStatus).toBe('function');
    });

    test('exposes customer directory operations', () => {
        expect(typeof sales.getCustomers).toBe('function');
        expect(typeof sales.createCustomer).toBe('function');
        expect(typeof sales.getCustomerSummary).toBe('function');
        expect(typeof sales.deleteCustomer).toBe('function');
        expect(typeof sales.updateCustomerGroup).toBe('function');
        expect(typeof sales.updateCustomer).toBe('function');
    });

    test('exposes exchange operations', () => {
        expect(typeof sales.createExchangeSale).toBe('function');
    });
});
