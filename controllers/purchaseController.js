/**
 * Purchase Controller Facade
 * Clean orchestrator aggregating modular sub-controllers:
 * - purchaseHelpers: Money helpers, serial checking, PO number generators, payment handlers
 * - supplierController: Supplier CRUD, summary, and ledger tracking
 * - purchaseOrderController: Purchase orders creation, listing, updating, and deletion
 * - purchaseQuotationController: Purchase quotation lifecycle
 */

const purchaseHelpers = require('./purchase/purchaseHelpers');
const supplierController = require('./purchase/supplierController');
const purchaseOrderController = require('./purchase/purchaseOrderController');
const purchaseQuotationController = require('./purchase/purchaseQuotationController');

module.exports = {
    // Shared Helpers
    ...purchaseHelpers,

    // Supplier Management
    getSuppliers: supplierController.getSuppliers,
    createSupplier: supplierController.createSupplier,
    deleteSupplier: supplierController.deleteSupplier,
    getSupplierSummary: supplierController.getSupplierSummary,

    // Purchase Orders & Accounts
    getAccounts: purchaseOrderController.getAccounts,
    createOrder: purchaseOrderController.createOrder,
    getOrders: purchaseOrderController.getOrders,
    getOrderById: purchaseOrderController.getOrderById,
    updateOrder: purchaseOrderController.updateOrder,
    deleteOrder: purchaseOrderController.deleteOrder,
    checkSerial: purchaseOrderController.checkSerial,

    // Purchase Quotations
    getQuotations: purchaseQuotationController.getQuotations,
    getQuotationById: purchaseQuotationController.getQuotationById,
    createQuotation: purchaseQuotationController.createQuotation,
    updateQuotation: purchaseQuotationController.updateQuotation,
    updateQuotationStatus: purchaseQuotationController.updateQuotationStatus,
    deleteQuotation: purchaseQuotationController.deleteQuotation,
};
