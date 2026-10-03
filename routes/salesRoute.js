const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const salesPaymentController = require('../controllers/sales/salesPaymentController');
const { upload, uploadTempShare } = require('../controllers/invoiceShareController');

// 1. Quotations (must come before /:id)
router.get('/quotations', salesController.getQuotations);
router.get('/quotations/:id', salesController.getQuotationById);
router.post('/quotations', salesController.createQuotation);
router.put('/quotations/:id', salesController.updateQuotation);
router.patch('/quotations/:id/status', salesController.updateQuotationStatus);
router.delete('/quotations/:id', salesController.deleteQuotation);

// 2. Customers
router.get('/customers', salesController.getCustomers);
router.post('/customers', salesController.createCustomer);
router.put('/customers/:id', salesController.updateCustomer);
router.patch('/customers/:id/group', salesController.updateCustomerGroup);
router.get('/customers/:id/summary', salesController.getCustomerSummary);
router.post('/customers/:id/bulk-due-payment', salesPaymentController.collectCustomerBulkDuePayment);
router.delete('/customers/:id', salesController.deleteCustomer);

// 3. Sales & POS
router.get('/', salesController.getSales);
router.post('/:id/payments', salesPaymentController.collectSaleInvoicePayment);
router.post('/exchange', salesController.createExchangeSale);
router.post('/', salesController.createSale);
router.post('/create', salesController.createSale);
router.get('/:id', salesController.getSaleById);
router.put('/:id', salesController.updateSale);
router.delete('/:id', salesController.deleteSale);

// Temporary Share Upload
router.post('/temp-share', upload.single('file'), uploadTempShare);

module.exports = router;