/**
 * Search Controller (Facade Module)
 * Architectural Decomposition: SRP & Facade Pattern
 * 
 * Sub-modules:
 * - ./search/searchProductController.js: Product searches & response formatting
 * - ./search/searchCustomerController.js: Customer searches with account balances
 * - ./search/searchInvoiceController.js: Sales invoices lookup
 * - ./search/globalSearchController.js: Parallel multi-entity global aggregation
 * - ./search/barcodeLookupController.js: 4-dimension unified serial/barcode lookup
 */

const { formatProductResponse, searchProduct } = require('./search/searchProductController');
const { searchCustomer } = require('./search/searchCustomerController');
const { searchInvoice } = require('./search/searchInvoiceController');
const { globalSearch } = require('./search/globalSearchController');
const { barcodeLookup } = require('./search/barcodeLookupController');

module.exports = {
    formatProductResponse,
    searchProduct,
    searchCustomer,
    searchInvoice,
    globalSearch,
    barcodeLookup,
};
