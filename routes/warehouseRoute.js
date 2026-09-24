const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouseController');

// 1. Get all warehouses (supports ?active=true)
router.get('/', warehouseController.getWarehouses);

// 2. Get single warehouse
router.get('/:id', warehouseController.getWarehouseById);

// 3. Create new warehouse
router.post('/', warehouseController.createWarehouse);

// 4. Update warehouse details
router.put('/:id', warehouseController.updateWarehouse);

// 5. Set default warehouse
router.put('/:id/default', warehouseController.setDefaultWarehouse);

// 6. Delete (soft-delete) warehouse
router.delete('/:id', warehouseController.deleteWarehouse);

module.exports = router;
