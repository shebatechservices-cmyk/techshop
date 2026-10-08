const partyQuery = require('./party/partyQueryController');
const partyLifecycle = require('./party/partyLifecycleController');
const partyTransaction = require('./party/partyTransactionController');

module.exports = {
    // Queries
    getParties: partyQuery.getParties,
    getPartyProfile: partyQuery.getPartyProfile,

    // Lifecycle
    updatePartyProfile: partyLifecycle.updatePartyProfile,
    deleteParty: partyLifecycle.deleteParty,

    // Transactions
    handlePartyTransaction: partyTransaction.handlePartyTransaction,
};
