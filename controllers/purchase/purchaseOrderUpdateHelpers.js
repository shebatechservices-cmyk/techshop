/**
 * Purchase Order Update Helpers Facade
 * Cleanly re-exports validation, item reconciliation, and payment reconciliation submodules.
 * Maintains 100% backward compatibility for all controllers and test suites.
 */
const {
    checkPoEditabilityAndSoldItems,
    validatePayloadItemsAndSerials,
} = require('./update/poUpdateValidation');

const {
    reconcilePurchaseOrderItems,
} = require('./update/poItemReconciler');

const {
    reconcilePurchaseOrderPayments,
} = require('./update/poPaymentReconciler');

module.exports = {
    checkPoEditabilityAndSoldItems,
    validatePayloadItemsAndSerials,
    reconcilePurchaseOrderItems,
    reconcilePurchaseOrderPayments,
};
