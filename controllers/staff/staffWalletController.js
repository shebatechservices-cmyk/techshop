const {
    getStaffWallet,
    adjustStaffWallet
} = require('./wallet/staffWalletOverviewController');

const {
    submitWalletRequest,
    getStaffWalletRequests,
    getPendingWalletRequests
} = require('./wallet/staffWalletRequestsController');

const {
    respondWalletRequest
} = require('./wallet/staffWalletApprovalController');

module.exports = {
    getStaffWallet,
    adjustStaffWallet,
    submitWalletRequest,
    getStaffWalletRequests,
    getPendingWalletRequests,
    respondWalletRequest
};
