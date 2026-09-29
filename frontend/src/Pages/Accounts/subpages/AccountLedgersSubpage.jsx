import React from 'react';
import LedgerStatsCards from '../components/LedgerStatsCards';
import LedgerAccountsGrid from '../components/LedgerAccountsGrid';
import LedgerTransactionTable from '../components/LedgerTransactionTable';

export default function AccountLedgersSubpage({
  wallets = [],
  transactions = [],
  filteredTransactions = [],
  totalBalance = 0,
  loading = false,
  txSearchQuery = '',
  setTxSearchQuery,
  selectedTxTypeFilter = 'all',
  setSelectedTxTypeFilter,
  selectedWalletFilter = 'all',
  setSelectedWalletFilter,
  loadAccountsData,
  setIsAddAccountOpen,
  openCashFlow,
  openEditWallet,
  handleDeleteWallet,
  setSelectedTxForDetails,
  handleReverseTransaction,
}) {
  if (loading) {
    return (
      <div className="p-10 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
        <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="font-bold text-slate-900 m-0 text-sm">Loading accounts and ledger data...</p>
        <p className="text-xs text-slate-400 mt-1 mb-0">Synchronizing balances with database</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 1. Stats KPI Cards */}
      <LedgerStatsCards
        totalBalance={totalBalance}
        wallets={wallets}
        transactions={transactions}
      />

      {/* 2. Account Drawers Grid */}
      <LedgerAccountsGrid
        wallets={wallets}
        setIsAddAccountOpen={setIsAddAccountOpen}
        openCashFlow={openCashFlow}
        openEditWallet={openEditWallet}
        handleDeleteWallet={handleDeleteWallet}
      />

      {/* 3. Central Transaction Ledger Table */}
      <LedgerTransactionTable
        wallets={wallets}
        filteredTransactions={filteredTransactions}
        txSearchQuery={txSearchQuery}
        setTxSearchQuery={setTxSearchQuery}
        selectedTxTypeFilter={selectedTxTypeFilter}
        setSelectedTxTypeFilter={setSelectedTxTypeFilter}
        selectedWalletFilter={selectedWalletFilter}
        setSelectedWalletFilter={setSelectedWalletFilter}
        loadAccountsData={loadAccountsData}
        loading={loading}
        setSelectedTxForDetails={setSelectedTxForDetails}
        handleReverseTransaction={handleReverseTransaction}
      />
    </div>
  );
}
