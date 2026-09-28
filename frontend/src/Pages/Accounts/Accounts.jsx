import React from 'react';
import useAccountsManager from './hooks/useAccountsManager';
import AccountsHeader from './components/AccountsHeader';
import AccountsModalsContainer from './components/AccountsModalsContainer';
import AccountLedgersSubpage from './subpages/AccountLedgersSubpage';
import PartiesLedgerSubpage from './subpages/PartiesLedgerSubpage';

export default function Accounts({ initialTab, onNavigateToExpenses }) {
  const {
    // State
    wallets,
    setWallets,
    tenders,
    setTenders,
    transactions,
    setTransactions,
    loading,
    setLoading,
    error,
    setError,
    successMsg,
    setSuccessMsg,
    activeSubpage,
    setActiveSubpage,
    handleSubpageChange,
    isDayCloseOpen,
    setIsDayCloseOpen,
    isAddPaymentMethodOpen,
    setIsAddPaymentMethodOpen,
    isAddAccountOpen,
    setIsAddAccountOpen,
    parties,
    setParties,
    partyTypeFilter,
    setPartyTypeFilter,
    partySearch,
    setPartySearch,
    partyPage,
    setPartyPage,
    partyPagination,
    setPartyPagination,
    partyCounts,
    setPartyCounts,
    loadingParties,
    setLoadingParties,
    selectedPartyModal,
    setSelectedPartyModal,
    isTransferOpen,
    setIsTransferOpen,
    transferForm,
    setTransferForm,
    transferLoading,
    setTransferLoading,
    transferError,
    setTransferError,
    isCashFlowOpen,
    setIsCashFlowOpen,
    cashFlowMode,
    setCashFlowMode,
    cashFlowAccount,
    setCashFlowAccount,
    cashFlowForm,
    setCashFlowForm,
    cashFlowLoading,
    setCashFlowLoading,
    cashFlowError,
    setCashFlowError,
    isEditWalletOpen,
    setIsEditWalletOpen,
    editWalletForm,
    setEditWalletForm,
    editWalletLoading,
    setEditWalletLoading,
    selectedTxForDetails,
    setSelectedTxForDetails,
    txSearchQuery,
    setTxSearchQuery,
    selectedTxTypeFilter,
    setSelectedTxTypeFilter,
    selectedWalletFilter,
    setSelectedWalletFilter,

    // Calculations & Memos
    totalBalance,
    filteredTransactions,

    // Actions & Handlers
    loadAccountsData,
    loadPartiesData,
    handleDeleteWallet,
    openEditWallet,
    handleSaveWalletEdit,
    openCashFlow,
    handleCashFlowSubmit,
    handleTransferSubmit,
    handleReverseTransaction,
  } = useAccountsManager({ initialTab });

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans">
      {/* 1. Unified Compact Header & Tab Bar (Single Row) */}
      <AccountsHeader
        activeSubpage={activeSubpage}
        handleSubpageChange={handleSubpageChange}
        walletsCount={wallets.length}
        partiesCount={partyCounts.total || parties.length}
        onOpenAddAccount={() => setIsAddAccountOpen(true)}
        onOpenTransfer={() => {
          setIsTransferOpen(true);
          setTransferError('');
        }}
        onOpenDayClose={() => setIsDayCloseOpen(true)}
        onNavigateToExpenses={onNavigateToExpenses}
        onRefresh={loadAccountsData}
        loading={loading}
      />

      {/* Alert Notifications */}
      {error && (
        <div className="py-2.5 px-3.5 mb-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError('')}
            className="py-0.5 px-2 bg-white border border-slate-300 rounded text-xs text-red-600 cursor-pointer hover:bg-red-50"
          >
            Dismiss
          </button>
        </div>
      )}
      {successMsg && (
        <div className="py-2.5 px-3.5 mb-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg('')}
            className="py-0.5 px-2 bg-white border border-slate-300 rounded text-xs text-emerald-600 cursor-pointer hover:bg-emerald-50"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3. Sub-page Content Rendering */}
      {activeSubpage === 'ledgers' && (
        <AccountLedgersSubpage
          wallets={wallets}
          transactions={transactions}
          filteredTransactions={filteredTransactions}
          totalBalance={totalBalance}
          loading={loading}
          txSearchQuery={txSearchQuery}
          setTxSearchQuery={setTxSearchQuery}
          selectedTxTypeFilter={selectedTxTypeFilter}
          setSelectedTxTypeFilter={setSelectedTxTypeFilter}
          selectedWalletFilter={selectedWalletFilter}
          setSelectedWalletFilter={setSelectedWalletFilter}
          loadAccountsData={loadAccountsData}
          setIsAddAccountOpen={setIsAddAccountOpen}
          openCashFlow={openCashFlow}
          openEditWallet={openEditWallet}
          handleDeleteWallet={handleDeleteWallet}
          setSelectedTxForDetails={setSelectedTxForDetails}
          handleReverseTransaction={handleReverseTransaction}
        />
      )}

      {activeSubpage === 'parties' && (
        <PartiesLedgerSubpage
          parties={parties}
          partyCounts={partyCounts}
          partyTypeFilter={partyTypeFilter}
          setPartyTypeFilter={setPartyTypeFilter}
          partySearch={partySearch}
          setPartySearch={setPartySearch}
          partyPage={partyPage}
          setPartyPage={setPartyPage}
          partyPagination={partyPagination}
          loadingParties={loadingParties}
          onOpenPartyModal={(partyType, partyId, initialTab) =>
            setSelectedPartyModal({ isOpen: true, partyType, partyId, initialTab })
          }
          onRefresh={loadPartiesData}
        />
      )}

      {/* 4. Central Modals Container */}
      <AccountsModalsContainer
        isAddPaymentMethodOpen={isAddPaymentMethodOpen}
        setIsAddPaymentMethodOpen={setIsAddPaymentMethodOpen}
        isAddAccountOpen={isAddAccountOpen}
        setIsAddAccountOpen={setIsAddAccountOpen}
        isEditWalletOpen={isEditWalletOpen}
        setIsEditWalletOpen={setIsEditWalletOpen}
        editWalletForm={editWalletForm}
        setEditWalletForm={setEditWalletForm}
        tenders={tenders}
        editWalletLoading={editWalletLoading}
        handleSaveWalletEdit={handleSaveWalletEdit}
        isTransferOpen={isTransferOpen}
        setIsTransferOpen={setIsTransferOpen}
        transferForm={transferForm}
        setTransferForm={setTransferForm}
        wallets={wallets}
        transferLoading={transferLoading}
        transferError={transferError}
        handleTransferSubmit={handleTransferSubmit}
        isCashFlowOpen={isCashFlowOpen}
        setIsCashFlowOpen={setIsCashFlowOpen}
        cashFlowMode={cashFlowMode}
        cashFlowAccount={cashFlowAccount}
        cashFlowForm={cashFlowForm}
        setCashFlowForm={setCashFlowForm}
        cashFlowLoading={cashFlowLoading}
        cashFlowError={cashFlowError}
        handleCashFlowSubmit={handleCashFlowSubmit}
        selectedPartyModal={selectedPartyModal}
        setSelectedPartyModal={setSelectedPartyModal}
        loadPartiesData={loadPartiesData}
        loadAccountsData={loadAccountsData}
        setSuccessMsg={setSuccessMsg}
        isDayCloseOpen={isDayCloseOpen}
        setIsDayCloseOpen={setIsDayCloseOpen}
        selectedTxForDetails={selectedTxForDetails}
        setSelectedTxForDetails={setSelectedTxForDetails}
      />
    </div>
  );
}
