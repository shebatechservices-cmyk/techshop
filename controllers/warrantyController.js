/**
 * Warranty Controller (Facade / Dispatcher)
 * Modularized sub-controllers:
 * - warrantySchema.js (Table migrations & grace period constants)
 * - warrantyCheckController.js (Instant warranty checks & expiring alerts)
 * - warrantyClaimController.js (Claim intake, tracking, status updates, deletions)
 * - warrantyReturnController.js (Returns, exchanges, refunds, restocking, reversals)
 */

const warrantyCheckController = require('./warranty/warrantyCheckController');
const warrantyClaimController = require('./warranty/warrantyClaimController');
const warrantyReturnController = require('./warranty/warrantyReturnController');

module.exports = {
    // Warranty Checks
    getExpiringWarranties: warrantyCheckController.getExpiringWarranties,
    checkWarranty: warrantyCheckController.checkWarranty,

    // Warranty Claims
    getClaims: warrantyClaimController.getClaims,
    createWarrantyClaim: warrantyClaimController.createWarrantyClaim,
    updateClaimStatus: warrantyClaimController.updateClaimStatus,
    updateClaim: warrantyClaimController.updateClaim,
    deleteClaim: warrantyClaimController.deleteClaim,

    // Product Returns & Refunds
    getReturns: warrantyReturnController.getReturns,
    processReturn: warrantyReturnController.processReturn,
    deleteReturn: warrantyReturnController.deleteReturn,
    updateReturn: warrantyReturnController.updateReturn,
};
