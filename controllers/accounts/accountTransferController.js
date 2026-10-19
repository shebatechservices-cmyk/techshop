// Facade controller for account transfers, deposits, withdrawals and due settlement (Rule 1: < 200 lines)
const accountDepositWithdrawController = require('./transfer/accountDepositWithdrawController');
const accountDueSettlementController = require('./transfer/accountDueSettlementController');

module.exports = {
    ...accountDepositWithdrawController,
    ...accountDueSettlementController,
};
