/**
 * Warehouse Controller Facade
 * Clean orchestrator aggregating modular sub-controllers:
 * - warehouseSchema: Database initialization and initial warehouse seeding
 * - warehouseQueryController: Fetch all warehouses, stock aggregates, single warehouse details
 * - warehouseMutationController: Warehouse creation and full detail updates
 * - warehouseOpsController: Default warehouse assignment and safe soft-deletion
 */

const { ensureWarehousesTable } = require('./warehouse/warehouseSchema');
const warehouseQueryController = require('./warehouse/warehouseQueryController');
const warehouseMutationController = require('./warehouse/warehouseMutationController');
const warehouseOpsController = require('./warehouse/warehouseOpsController');

module.exports = {
    ensureWarehousesTable,
    getWarehouses: warehouseQueryController.getWarehouses,
    getWarehouseById: warehouseQueryController.getWarehouseById,
    createWarehouse: warehouseMutationController.createWarehouse,
    updateWarehouse: warehouseMutationController.updateWarehouse,
    setDefaultWarehouse: warehouseOpsController.setDefaultWarehouse,
    deleteWarehouse: warehouseOpsController.deleteWarehouse
};
