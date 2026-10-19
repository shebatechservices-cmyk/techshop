const walletService = require('../services/walletService');
const queryController = require('./wallet/walletQueryController');
const txnController = require('./wallet/walletTxnController');
const reversalController = require('./wallet/walletReversalController');

const {
    ensureWalletSchema,
    normalizeEntityType,
    partyInfo,
    accountEffect,
    logAccountTxn,
    drawerLedgerOnly,
    getOrCreateWallet,
    writeWalletLedger,
    executeWalletTransaction,
    money,
} = walletService;

module.exports = {
    // Service helpers
    ensureWalletSchema,
    normalizeEntityType,
    partyInfo,
    accountEffect,
    logAccountTxn,
    drawerLedgerOnly,
    getOrCreateWallet,
    writeWalletLedger,
    executeWalletTransaction,
    money,

    // Query endpoints
    getWallets: queryController.getWallets,
    getPartyWallet: queryController.getPartyWallet,

    // Transaction endpoints
    postWalletTransaction: txnController.postWalletTransaction,
    postTopup: txnController.postTopup,
    postWithdraw: txnController.postWithdraw,
    postSettle: txnController.postSettle,

    // Reversal endpoints
    deleteWalletTransaction: reversalController.deleteWalletTransaction,
    editWalletTransaction: reversalController.editWalletTransaction,
};
