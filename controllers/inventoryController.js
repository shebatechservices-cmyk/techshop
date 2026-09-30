/**
 * Inventory Controller (Facade Module)
 * Architectural Decomposition: SRP & Facade Pattern
 * 
 * Sub-modules:
 * - ./inventory/inventoryQueryController.js: Stock query, valuation, inflow, aging, overview metrics
 * - ./inventory/inventorySerialWarrantyController.js: Serial lookup, history, and warranty details
 * - ./inventory/inventoryTransferController.js: Stock transfers between warehouses
 * - ./inventory/inventoryMaintenanceController.js: Force cleaning & e-commerce toggling
 * - ./warehouseController.js: Warehouses list
 */

const { getInventory } = require('./inventory/inventoryQueryController');
const { getProductWarranty, checkSerial } = require('./inventory/inventorySerialWarrantyController');
const { transferStock } = require('./inventory/inventoryTransferController');
const { toggleEcommerce, cleanStockForce } = require('./inventory/inventoryMaintenanceController');
const warehouseController = require('./warehouseController');

module.exports = {
    getInventory,
    getWarehouses: (req, res) => warehouseController.getWarehouses(req, res),
    getProductWarranty,
    toggleEcommerce,
    transferStock,
    cleanStockForce,
    checkSerial,
};
