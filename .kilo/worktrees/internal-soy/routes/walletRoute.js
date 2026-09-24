const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');

router.get('/:type/:id', walletController.getPartyWallet);
router.post('/transaction', walletController.postWalletTransaction);
router.delete('/transaction/:id', walletController.deleteWalletTransaction);
router.patch('/transaction/:id', walletController.editWalletTransaction);

module.exports = router;