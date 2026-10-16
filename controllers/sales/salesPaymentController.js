/**
 * Sales Payment Controller
 * Modularized into:
 *  - ./payment/salesPaymentHelpers: Money utilities, receipt numbering and account verifier
 *  - ./payment/saleInvoicePaymentHandler: Single invoice due payment collection
 *  - ./payment/customerBulkDuePaymentHandler: Customer bulk FIFO due payment collection
 */

const { collectSaleInvoicePayment } = require('./payment/saleInvoicePaymentHandler');
const { collectCustomerBulkDuePayment } = require('./payment/customerBulkDuePaymentHandler');

module.exports = {
  collectSaleInvoicePayment,
  collectCustomerBulkDuePayment,
};
