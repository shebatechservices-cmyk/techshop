/**
 * Master Sales Helpers Facade
 * Aggregates focused sales helper modules to provide single-point access with backwards compatibility.
 */
const {
    money,
    ensureSalesColumns,
    formatProductFullName,
} = require('./helpers/salesFormatHelpers');

const {
    normalizeSaleItems,
    validateSerialTracking,
    normalizeAndValidateItems,
} = require('./helpers/salesItemHelpers');

const {
    validateAvailableStockAndSerials,
    validateSaleDeletable,
} = require('./helpers/salesValidationHelpers');

const {
    getDrawerAccountId,
    resolvePaymentAccount,
    applySaleTender,
    reverseSaleTender,
    applyTenders,
    depositToDrawer,
    reverseCashFromDrawer,
} = require('./helpers/salesTenderHelpers');

const {
    reverseSaleFinancials,
} = require('./helpers/salesReversalHelpers');

module.exports = {
    money,
    ensureSalesColumns,
    formatProductFullName,
    normalizeSaleItems,
    validateSerialTracking,
    validateAvailableStockAndSerials,
    normalizeAndValidateItems,
    getDrawerAccountId,
    resolvePaymentAccount,
    applySaleTender,
    reverseSaleTender,
    applyTenders,
    depositToDrawer,
    reverseCashFromDrawer,
    validateSaleDeletable,
    reverseSaleFinancials,
};
