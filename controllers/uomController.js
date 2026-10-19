/**
 * Unit of Measurement (UOM) Controller Facade
 * Architectural Sub-Modules:
 * - uomSchema: Table creation and default UOM seed initialization
 * - uomQueryController: Fetch all UOMs and single UOM lookup
 * - uomMutationController: Create and update UOMs with duplicate protection and catalog sync
 * - uomDeleteController: Safe deletion with product catalog usage verification
 */

const { ensureUomTable } = require('./uom/uomSchema');
const uomQueryController = require('./uom/uomQueryController');
const uomMutationController = require('./uom/uomMutationController');
const uomDeleteController = require('./uom/uomDeleteController');

module.exports = {
    ensureUomTable,
    getAllUom: uomQueryController.getAllUom,
    getUomById: uomQueryController.getUomById,
    createUom: uomMutationController.createUom,
    updateUom: uomMutationController.updateUom,
    deleteUom: uomDeleteController.deleteUom
};
