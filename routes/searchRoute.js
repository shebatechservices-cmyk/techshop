const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

router.get('/product', searchController.searchProduct);
router.get('/customer', searchController.searchCustomer);
router.get('/invoice', searchController.searchInvoice);
router.get('/global', searchController.globalSearch);
router.get('/barcode-lookup', searchController.barcodeLookup);

module.exports = router;
