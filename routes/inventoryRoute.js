const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

// 1. Get Inventory list with metrics & filtering
router.get('/', inventoryController.getInventory);

// 2. Get list of warehouses
router.get('/warehouses', inventoryController.getWarehouses);

// 3. Get Serial & Warranty details for a specific product
router.get('/product/:id/warranty', inventoryController.getProductWarranty);

// 4. Toggle E-Commerce Active status
router.put('/product/:id/ecommerce', inventoryController.toggleEcommerce);

// 5. Stock Transfer
router.post('/transfer', inventoryController.transferStock);

// 6. Force Clean Inventory Stock
router.post('/clean-stock-force', inventoryController.cleanStockForce);

// 7. Check if serial/barcode exists
router.get('/check-serial', inventoryController.checkSerial);

module.exports = router;
