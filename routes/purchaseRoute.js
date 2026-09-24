const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');

// Payment Accounts
router.get('/accounts', purchaseController.getAccounts);

// Suppliers (list, create, summary, delete)
router.get('/suppliers', purchaseController.getSuppliers);
router.post('/suppliers', purchaseController.createSupplier);
router.delete('/suppliers/:id', purchaseController.deleteSupplier);
router.get('/suppliers/:id/summary', purchaseController.getSupplierSummary);

// Quotations (list, get one, create, update, status update, delete)
router.get('/quotations', purchaseController.getQuotations);
router.get('/quotations/:id', purchaseController.getQuotationById);
router.post('/quotations', purchaseController.createQuotation);
router.put('/quotations/:id', purchaseController.updateQuotation);
router.patch('/quotations/:id/status', purchaseController.updateQuotationStatus);
router.delete('/quotations/:id', purchaseController.deleteQuotation);

// Purchase Orders
router.get('/check-serial', purchaseController.checkSerial);
router.post('/', purchaseController.createOrder);
router.post('/orders', purchaseController.createOrder);
router.get('/', purchaseController.getOrders);
router.get('/:id', purchaseController.getOrderById);
router.put('/:id', purchaseController.updateOrder);
router.delete('/:id', purchaseController.deleteOrder);

module.exports = router;

