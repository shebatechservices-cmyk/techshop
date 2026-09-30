/**
 * Purchase Order Mutation Controller (Facade)
 * Aggregates specialized mutation sub-controllers:
 * - purchaseOrderDeleteController.js (Graceful deletion, sales linkage guard, warehouse inventory rollback)
 * - purchaseOrderUpdateController.js (Order edits, sold-quantity constraints, cascade serial sync, tender recalculations)
 */

const { deleteOrder } = require('./purchaseOrderDeleteController');
const { updateOrder } = require('./purchaseOrderUpdateController');

module.exports = {
    deleteOrder,
    updateOrder
};
