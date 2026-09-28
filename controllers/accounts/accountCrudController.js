/**
 * Account CRUD Controller (Facade)
 * Combines modular controllers:
 * - paymentAccountController.js (Payment Accounts CRUD & Safe Deletion)
 * - tenderController.js (Tender/Method types CRUD)
 * - subledgerAccountController.js (Sub-ledger Account Records CRUD)
 */

const paymentAccountController = require('./paymentAccountController');
const tenderController = require('./tenderController');
const subledgerAccountController = require('./subledgerAccountController');

module.exports = {
    // Payment Accounts
    createAccount: paymentAccountController.createAccount,
    getAccounts: paymentAccountController.getAccounts,
    updateAccount: paymentAccountController.updateAccount,
    deleteAccount: paymentAccountController.deleteAccount,

    // Tenders
    getTenders: tenderController.getTenders,
    createTender: tenderController.createTender,
    updateTender: tenderController.updateTender,
    deleteTender: tenderController.deleteTender,

    // Sub-ledger Account Records
    getAccountsList: subledgerAccountController.getAccountsList,
    createAccountRecord: subledgerAccountController.createAccountRecord,
    updateAccountRecord: subledgerAccountController.updateAccountRecord,
    updateAccountBalance: subledgerAccountController.updateAccountBalance,
    deleteAccountRecord: subledgerAccountController.deleteAccountRecord,
};
