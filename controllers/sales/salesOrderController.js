/**
 * Sales Order Controller Facade
 * 
 * Modularized sub-controllers:
 * - salesOrderCreateController: Invoice creation (POST /api/sales/create)
 * - salesOrderQueryController: Invoice retrieval (GET /api/sales, GET /api/sales/:id)
 * - salesOrderUpdateController: Invoice modification (PUT /api/sales/:id)
 * - salesOrderDeleteController: Invoice deletion & trash archiving (DELETE /api/sales/:id)
 */

const { createSale } = require('./order/salesOrderCreateController');
const { getSales, getSaleById } = require('./order/salesOrderQueryController');
const { updateSale } = require('./order/salesOrderUpdateController');
const { deleteSale } = require('./order/salesOrderDeleteController');

module.exports = {
    createSale,
    getSales,
    getSaleById,
    updateSale,
    deleteSale,
};
