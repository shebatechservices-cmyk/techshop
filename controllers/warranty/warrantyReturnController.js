/**
 * Warranty Return Controller Facade
 * Architectural Sub-Modules:
 * - returnsQueryController: Listing product returns with filtering and metadata updates
 * - returnsProcessController: Validating return, restocking inventory, handling store credit and cash refunds
 * - returnsDeleteController: Soft deletion to trash with full stock and financial reversals
 */

const returnsQuery = require('./returns/returnsQueryController');
const returnsProcess = require('./returns/returnsProcessController');
const returnsDelete = require('./returns/returnsDeleteController');

module.exports = {
    getReturns: returnsQuery.getReturns,
    updateReturn: returnsQuery.updateReturn,
    processReturn: returnsProcess.processReturn,
    deleteReturn: returnsDelete.deleteReturn
};
