// Facade controller for sales quotations (Rule 1: < 200 lines)
const salesQuotationQueryController = require('./quotation/salesQuotationQueryController');
const salesQuotationMutationController = require('./quotation/salesQuotationMutationController');

module.exports = {
    ...salesQuotationQueryController,
    ...salesQuotationMutationController,
};
