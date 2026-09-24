const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

// Lookup and Wallet routes (must be before /:id)
router.get('/invoices-lookup', projectController.getInvoicesLookup);
router.get('/technicians-lookup', projectController.getTechniciansLookup);
router.get('/tech-wallets', projectController.getTechWallets);
router.post('/tech-payout', projectController.payoutTechWallet);
router.get('/tech-wallet-history/:wallet_id', projectController.getTechWalletHistory);

// Core CRUD and Workflow routes
router.get('/', projectController.getProjects);
router.post('/', projectController.createProject);
router.put('/:id/technician-respond', projectController.technicianRespond);
router.put('/:id/incharge-confirm', projectController.confirmByIncharge);
router.put('/:id/progress', projectController.updateProgress);
router.put('/:id/complete', projectController.completeProject);
router.delete('/:id', projectController.deleteProject);

module.exports = router;
