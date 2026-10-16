/**
 * Purchase Helpers Facade
 * Cleanly re-exports core helpers, payment resolvers, and payment processors
 * maintaining 100% backward compatibility for all controllers and tests.
 */
const {
    money,
    formatProductFullName,
    makePoNumber,
    ensurePurchaseColumns,
    checkSerial,
} = require('./helpers/purchaseCoreHelpers');

const {
    resolvePaymentAccount,
} = require('./helpers/purchasePaymentAccountResolver');

const {
    applyPurchasePayment,
    reversePurchasePayment,
} = require('./helpers/purchasePaymentApplier');

const {
    adjustSupplierPayableBalance,
    syncPurchaseExtraCostExpense,
} = require('./purchaseExpenseSync');

module.exports = {
    money,
    formatProductFullName,
    makePoNumber,
    ensurePurchaseColumns,
    checkSerial,
    resolvePaymentAccount,
    applyPurchasePayment,
    reversePurchasePayment,
    adjustSupplierPayableBalance,
    syncPurchaseExtraCostExpense,
};
