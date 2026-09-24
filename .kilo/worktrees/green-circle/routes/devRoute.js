const express = require('express');
const router = express.Router();
const devController = require('../controllers/devConsoleController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

router.use(requireAuth, requireRole(1));

router.get('/info', devController.getSystemInfo);
router.post('/force-delete', devController.forceDeleteRecord);
router.post('/force-update', devController.forceUpdateRecord);
router.post('/maintenance', devController.runMaintenance);
router.post('/clean-inventory-stock', devController.cleanInventoryStock);

// App User Admin Credentials Management & Recovery
router.get('/admin-credentials', devController.getAppAdminCredentials);
router.post('/admin-credentials', devController.updateAppAdminCredentials);
router.get('/admin-recovery-requests', devController.getAdminRecoveryRequests);
router.post('/admin-recovery-resolve', devController.resolveAdminRecovery);

// Full Developer User & Staff Management
router.get('/users', devController.getDeveloperUsers);
router.post('/users', devController.createDeveloperUser);
router.put('/users/:id', devController.updateDeveloperUser);
router.delete('/users/:id', devController.deleteDeveloperUser);

module.exports = router;
