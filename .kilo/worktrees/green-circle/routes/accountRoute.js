const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const { checkPermission } = require('../middlewares/authMiddleware');

router.get('/', accountController.getAccounts);
router.get('/wallets', accountController.getAccounts);
router.get('/transactions', accountController.getTransactions);
router.get('/day-close-summary', accountController.getDayCloseSummary);
router.post('/transfer', checkPermission('manage_settings'), accountController.transferFunds);
router.post('/', checkPermission('manage_settings'), accountController.createAccount);
router.post('/wallets/create', checkPermission('manage_settings'), accountController.createAccount);
router.post('/deposit', checkPermission('manage_settings'), accountController.depositToAccount);
router.post('/withdraw', checkPermission('manage_settings'), accountController.withdrawFromAccount);
router.post('/pay-due', checkPermission('manage_settings'), accountController.payDueViaWallet);
router.delete('/:id', checkPermission('manage_settings'), accountController.deleteAccount);
router.delete('/wallets/:id', checkPermission('manage_settings'), accountController.deleteAccount);
router.put('/:id', checkPermission('manage_settings'), accountController.updateAccount);
router.put('/wallets/:id', checkPermission('manage_settings'), accountController.updateAccount);

const settingsController = require('../controllers/settingsController');
router.get('/payment-methods', settingsController.getPaymentMethods);
router.post('/payment-methods', settingsController.addPaymentMethod);
router.put('/payment-methods/:id/toggle', settingsController.togglePaymentMethod);
router.delete('/payment-methods/:id', settingsController.deletePaymentMethod);

module.exports = router;
