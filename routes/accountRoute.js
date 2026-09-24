const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const { checkPermission } = require('../middlewares/authMiddleware');

router.get('/', accountController.getAccounts);
router.get('/wallets', accountController.getAccounts);
router.get('/transactions', accountController.getTransactions);
router.put('/transactions/:id', accountController.updateTransaction);
router.delete('/transactions/:id', accountController.deleteTransaction);
router.post('/transactions/:id/reverse', accountController.reverseTransaction);
router.post('/adjustment', accountController.reverseTransaction);
router.get('/day-close-summary', accountController.getDayCloseSummary);
router.post('/transfer', accountController.transferFunds);
router.post('/', accountController.createAccount);
router.post('/wallets/create', accountController.createAccount);
router.post('/deposit', accountController.depositToAccount);
router.post('/withdraw', accountController.withdrawFromAccount);
router.post('/pay-due', accountController.payDueViaWallet);
const settingsController = require('../controllers/settingsController');
router.get('/payment-methods', settingsController.getPaymentMethods);
router.post('/payment-methods', settingsController.addPaymentMethod);
router.put('/payment-methods/:id', settingsController.updatePaymentMethod);
router.put('/payment-methods/:id/toggle', settingsController.togglePaymentMethod);
router.delete('/payment-methods/:id', settingsController.deletePaymentMethod);

// Tender & Account routes for "New Account Create" module
router.get('/tenders', accountController.getTenders);
router.post('/tenders', accountController.createTender);
router.put('/tenders/:id', accountController.updateTender);
router.delete('/tenders/:id', accountController.deleteTender);

router.get('/account-records', accountController.getAccountsList);
router.post('/account-records', accountController.createAccountRecord);
router.put('/account-records/:id', accountController.updateAccountRecord);
router.put('/account-records/:id/balance', accountController.updateAccountBalance);
router.delete('/account-records/:id', accountController.deleteAccountRecord);

router.delete('/wallets/:id', accountController.deleteAccount);
router.put('/wallets/:id', accountController.updateAccount);
router.delete('/:id', accountController.deleteAccount);
router.put('/:id', accountController.updateAccount);

module.exports = router;
