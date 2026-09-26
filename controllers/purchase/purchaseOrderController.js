/**
 * Purchase Order Controller (Facade / Dispatcher)
 * Modularized sub-controllers:
 * - purchaseOrderCreateController.js (Order creation, multi-item validation, expense logging)
 * - purchaseOrderQueryController.js (Order list, detail fetching, account lookups, serial checks)
 * - purchaseOrderMutationController.js (Order updates, soft deletion, inventory rollback)
 */

const { createOrder } = require('./purchaseOrderCreateController');
const { getAccounts, getOrders, getOrderById, checkSerial } = require('./purchaseOrderQueryController');
const { deleteOrder, updateOrder } = require('./purchaseOrderMutationController');

module.exports = {
    getAccounts,
    createOrder,
    getOrders,
    getOrderById,
    deleteOrder,
    updateOrder,
    checkSerial,
};
