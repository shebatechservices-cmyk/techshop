const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const { requireRole } = require('../middlewares/authMiddleware');

router.get('/', accountController.getAccounts);
router.get('/wallets', accountController.getAccounts);
router.get('/transactions', accountController.getTransactions);
router.put('/transactions/:id', requireRole(1, 2), accountController.updateTransaction);
router.delete('/transactions/:id', requireRole(1, 2), accountController.deleteTransaction);
router.post('/transactions/:id/reverse', requireRole(1, 2), accountController.reverseTransaction);
router.post('/adjustment', requireRole(1, 2), accountController.reverseTransaction);
router.get('/day-close-summary', accountController.getDayCloseSummary);
router.post('/transfer', requireRole(1, 2), accountController.transferFunds);
router.post('/', requireRole(1, 2), accountController.createAccount);
router.post('/wallets/create', requireRole(1, 2), accountController.createAccount);
router.post('/deposit', requireRole(1, 2), accountController.depositToAccount);
router.post('/withdraw', requireRole(1, 2), accountController.withdrawFromAccount);
router.post('/pay-due', accountController.payDueViaWallet);

const settingsController = require('../controllers/settingsController');
router.get('/payment-methods', settingsController.getPaymentMethods);
router.post('/payment-methods', requireRole(1, 2), settingsController.addPaymentMethod);
router.put('/payment-methods/:id', requireRole(1, 2), settingsController.updatePaymentMethod);
router.put('/payment-methods/:id/toggle', requireRole(1, 2), settingsController.togglePaymentMethod);
router.delete('/payment-methods/:id', requireRole(1, 2), settingsController.deletePaymentMethod);

// Tender & Account routes for "New Account Create" module
router.get('/tenders', accountController.getTenders);
router.post('/tenders', requireRole(1, 2), accountController.createTender);
router.put('/tenders/:id', requireRole(1, 2), accountController.updateTender);
router.delete('/tenders/:id', requireRole(1, 2), accountController.deleteTender);

router.get('/account-records', accountController.getAccountsList);
router.post('/account-records', requireRole(1, 2), accountController.createAccountRecord);
router.put('/account-records/:id', requireRole(1, 2), accountController.updateAccountRecord);
router.put('/account-records/:id/balance', requireRole(1, 2), accountController.updateAccountBalance);
router.delete('/account-records/:id', requireRole(1, 2), accountController.deleteAccountRecord);

router.delete('/wallets/:id', requireRole(1, 2), accountController.deleteAccount);
router.put('/wallets/:id', requireRole(1, 2), accountController.updateAccount);
router.delete('/:id', requireRole(1, 2), accountController.deleteAccount);
router.put('/:id', requireRole(1, 2), accountController.updateAccount);

module.exports = router;
