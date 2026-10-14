/**
 * Centralized Multi-Entity Wallet Service (Aggregator)
 * Modularized into:
 *  - ./wallet/walletSchema: DDL migrations and table synchronizations
 *  - ./wallet/walletEntityHelpers: Entity resolution, type normalization, and provisioners
 *  - ./wallet/walletLedgerHelpers: Double-entry accounting and ledger records
 *  - ./wallet/walletRulesEngine: Customer, supplier, and staff atomic transaction engines
 */

const { ensureWalletSchema } = require('./wallet/walletSchema');
const { money, normalizeEntityType, partyInfo, getOrCreateWallet } = require('./wallet/walletEntityHelpers');
const { accountEffect, logAccountTxn, drawerLedgerOnly, writeWalletLedger } = require('./wallet/walletLedgerHelpers');
const { executeWalletTransaction } = require('./wallet/walletRulesEngine');

// Run eagerly so DDL is completed on startup
ensureWalletSchema().catch(() => {});

module.exports = {
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
};
