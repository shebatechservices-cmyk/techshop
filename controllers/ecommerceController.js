const { ensureEcommerceColumns } = require("./ecommerce/ecommerceSchema");
const orderController = require("./ecommerce/ecommerceOrderController");
const queryController = require("./ecommerce/ecommerceQueryController");
const mutationController = require("./ecommerce/ecommerceMutationController");

module.exports = {
    ensureEcommerceColumns,
    createOrder: orderController.createOrder,
    deleteOrder: orderController.deleteOrder,
    getOrders: queryController.getOrders,
    trackOrder: queryController.trackOrder,
    updateOrderStatus: mutationController.updateOrderStatus,
    updateOrderDetails: mutationController.updateOrderDetails,
    customerSignup: mutationController.customerSignup,
};