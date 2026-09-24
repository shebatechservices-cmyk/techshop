const express = require('express');
const router = express.Router();
const warrantyController = require('../controllers/warrantyController');
const { checkPermission } = require('../middlewares/authMiddleware');

// Warranty & Serial Lookup
router.get('/check', warrantyController.checkWarranty);
router.get('/expiring', warrantyController.getExpiringWarranties);

// Warranty Claims Management
router.get('/claims', warrantyController.getClaims);
router.post('/claims', warrantyController.createWarrantyClaim);
router.patch('/claims/:id/status', warrantyController.updateClaimStatus);
router.put('/claims/:id', warrantyController.updateClaim);
router.delete('/claims/:id', warrantyController.deleteClaim);

// Product Returns & Exchanges
router.get('/returns', warrantyController.getReturns);
router.post('/returns', warrantyController.processReturn);
router.put('/returns/:id', warrantyController.updateReturn);
router.delete('/returns/:id', warrantyController.deleteReturn);

// Legacy backward compatibility endpoints
router.post('/offline/claim', warrantyController.createWarrantyClaim);
router.post('/offline/return', warrantyController.processReturn);
router.post('/ecommerce/claim', warrantyController.createWarrantyClaim);
router.post('/ecommerce/return', warrantyController.processReturn);

module.exports = router;