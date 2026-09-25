/**
 * Sales Controller Facade
 * Clean orchestrator aggregating modular sub-controllers:
 * - salesOrderController: Sales invoice creation, listing, updating, deletion, POS
 * - salesQuotationController: Quotation lifecycle
 * - salesCustomerController: Customer directory and account summaries
 * - salesExchangeController: Product exchange invoices and inventory adjustments
 * - salesHelpers: Shared calculation and financial ledger reversal routines
 */

const salesHelpers = require('./sales/salesHelpers');
const salesOrderController = require('./sales/salesOrderController');
const salesQuotationController = require('./sales/salesQuotationController');
const salesCustomerController = require('./sales/salesCustomerController');
const salesExchangeController = require('./sales/salesExchangeController');

module.exports = {
    // Shared Helpers
    ...salesHelpers,

    // Sales Orders & POS Invoices
    createSale: salesOrderController.createSale,
    getSales: salesOrderController.getSales,
    getSaleById: salesOrderController.getSaleById,
    deleteSale: salesOrderController.deleteSale,
    updateSale: salesOrderController.updateSale,

    // Quotations
    getQuotations: salesQuotationController.getQuotations,
    getQuotationById: salesQuotationController.getQuotationById,
    createQuotation: salesQuotationController.createQuotation,
    updateQuotation: salesQuotationController.updateQuotation,
    deleteQuotation: salesQuotationController.deleteQuotation,
    updateQuotationStatus: salesQuotationController.updateQuotationStatus,

    // Customer Directory
    getCustomers: salesCustomerController.getCustomers,
    createCustomer: salesCustomerController.createCustomer,
    getCustomerSummary: salesCustomerController.getCustomerSummary,
    deleteCustomer: salesCustomerController.deleteCustomer,
    updateCustomerGroup: salesCustomerController.updateCustomerGroup,
    updateCustomer: salesCustomerController.updateCustomer,

    // Exchange
    createExchangeSale: salesExchangeController.createExchangeSale,
};