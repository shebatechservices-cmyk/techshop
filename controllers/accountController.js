/**
 * Account Controller (Facade / Dispatcher)
 * Modularized sub-controllers:
 * - accountCrudController.js (Account & Tender CRUD, Sub-ledger accounts)
 * - accountTransferController.js (Deposits, Withdrawals, Dues, Transfers)
 * - accountLedgerController.js (Ledger Transactions, Immutability enforcement, Offsetting reversals)
 * - dayCloseController.js (Z-Report Day Close Summary)
 */

const accountCrudController = require('./accounts/accountCrudController');
const accountTransferController = require('./accounts/accountTransferController');
const accountLedgerController = require('./accounts/accountLedgerController');
const dayCloseController = require('./accounts/dayCloseController');

module.exports = {
    // Account & Tender CRUD
    createAccount: accountCrudController.createAccount,
    getAccounts: accountCrudController.getAccounts,
    updateAccount: accountCrudController.updateAccount,
    deleteAccount: accountCrudController.deleteAccount,
    getTenders: accountCrudController.getTenders,
    createTender: accountCrudController.createTender,
    updateTender: accountCrudController.updateTender,
    deleteTender: accountCrudController.deleteTender,
    getAccountsList: accountCrudController.getAccountsList,
    createAccountRecord: accountCrudController.createAccountRecord,
    updateAccountRecord: accountCrudController.updateAccountRecord,
    updateAccountBalance: accountCrudController.updateAccountBalance,
    deleteAccountRecord: accountCrudController.deleteAccountRecord,

    // Transfers & Dues
    depositToAccount: accountTransferController.depositToAccount,
    withdrawFromAccount: accountTransferController.withdrawFromAccount,
    payDueViaWallet: accountTransferController.payDueViaWallet,
    transferFunds: accountTransferController.transferFunds,

    // Ledger & Transactions
    getTransactions: accountLedgerController.getTransactions,
    updateTransaction: accountLedgerController.updateTransaction,
    deleteTransaction: accountLedgerController.deleteTransaction,
    reverseTransaction: accountLedgerController.reverseTransaction,

    // Day Close / Z-Report
    getDayCloseSummary: dayCloseController.getDayCloseSummary,
};
