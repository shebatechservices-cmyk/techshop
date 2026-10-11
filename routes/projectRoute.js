const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { requireRole } = require('../middlewares/authMiddleware');

// Lookup and Wallet routes (must be before /:id)
router.get('/invoices-lookup', projectController.getInvoicesLookup);
router.get('/technicians-lookup', projectController.getTechniciansLookup);
router.get('/tech-wallets', requireRole(1, 2), projectController.getTechWallets);
router.post('/tech-payout', requireRole(1, 2), projectController.payoutTechWallet);
router.get('/tech-wallet-history/:wallet_id', requireRole(1, 2), projectController.getTechWalletHistory);

// Service Presets CRUD routes (Admin only: Rule 1)
router.get('/service-presets', projectController.getServicePresets);
router.post('/service-presets', requireRole(1, 2), projectController.createServicePreset);
router.put('/service-presets/:id', requireRole(1, 2), projectController.updateServicePreset);
router.delete('/service-presets/:id', requireRole(1, 2), projectController.deleteServicePreset);

// Project / Job Types CRUD routes (Admin only: Rule 1)
router.get('/job-types', projectController.getJobTypes);
router.post('/job-types', requireRole(1, 2), projectController.createJobType);
router.put('/job-types/:id', requireRole(1, 2), projectController.updateJobType);
router.delete('/job-types/:id', requireRole(1, 2), projectController.deleteJobType);

// Core CRUD and Workflow routes
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProjectById);
router.post('/', requireRole(1, 2), projectController.createProject);
router.put('/:id', requireRole(1, 2), projectController.updateProject);
router.put('/:id/technician-respond', projectController.technicianRespond);
router.put('/:id/admin-respond-rejection', requireRole(1, 2), projectController.adminRespondRejection);
router.put('/:id/incharge-confirm', requireRole(1, 2), projectController.confirmByIncharge);
router.put('/:id/progress', projectController.updateProgress);
router.put('/:id/complete', requireRole(1, 2), projectController.completeProject);
router.put('/:id/reopen', requireRole(1, 2), projectController.reopenProject);
router.delete('/:id', requireRole(1, 2), projectController.deleteProject);

module.exports = router;
