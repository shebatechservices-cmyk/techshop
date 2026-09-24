const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');

// Centralized wallet routes
router.get('/', walletController.getWallets);
router.get('/list', walletController.getWallets);
router.post('/topup', walletController.postTopup);
router.post('/withdraw', walletController.postWithdraw);
router.post('/settle', walletController.postSettle);
router.post('/transaction', walletController.postWalletTransaction);
router.get('/:type/:id', walletController.getPartyWallet);
router.delete('/transaction/:id', walletController.deleteWalletTransaction);
router.patch('/transaction/:id', walletController.editWalletTransaction);

module.exports = router;
