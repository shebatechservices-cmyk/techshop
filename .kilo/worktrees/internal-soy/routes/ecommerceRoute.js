const express = require('express');
const router = express.Router();
const ecommerceController = require('../controllers/ecommerceController');

router.get('/orders', ecommerceController.getOrders);
router.post('/orders', ecommerceController.createOrder);
router.patch('/orders/:id/status', ecommerceController.updateOrderStatus);
router.put('/orders/:id', ecommerceController.updateOrderDetails);
router.delete('/orders/:id', ecommerceController.deleteOrder);
router.get('/track/:query', ecommerceController.trackOrder);
router.post('/customer/signup', ecommerceController.customerSignup);

module.exports = router;


