const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

// Lookup and Wallet routes (must be before /:id)
router.get('/invoices-lookup', projectController.getInvoicesLookup);
router.get('/technicians-lookup', projectController.getTechniciansLookup);
router.get('/tech-wallets', projectController.getTechWallets);
router.post('/tech-payout', projectController.payoutTechWallet);
router.get('/tech-wallet-history/:wallet_id', projectController.getTechWalletHistory);

// Service Presets CRUD routes (RULE 1)
router.get('/service-presets', projectController.getServicePresets);
router.post('/service-presets', projectController.createServicePreset);
router.put('/service-presets/:id', projectController.updateServicePreset);
router.delete('/service-presets/:id', projectController.deleteServicePreset);

// Project / Job Types CRUD routes (RULE 1)
router.get('/job-types', projectController.getJobTypes);
router.post('/job-types', projectController.createJobType);
router.put('/job-types/:id', projectController.updateJobType);
router.delete('/job-types/:id', projectController.deleteJobType);

// Core CRUD and Workflow routes
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProjectById);
router.post('/', projectController.createProject);
router.put('/:id', projectController.updateProject);
router.put('/:id/technician-respond', projectController.technicianRespond);
router.put('/:id/incharge-confirm', projectController.confirmByIncharge);
router.put('/:id/progress', projectController.updateProgress);
router.put('/:id/complete', projectController.completeProject);
router.delete('/:id', projectController.deleteProject);

module.exports = router;
