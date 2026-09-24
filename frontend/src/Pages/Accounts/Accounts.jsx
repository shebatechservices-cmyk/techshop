import React from 'react';
import useAccountsManager from './hooks/useAccountsManager';
import PartyProfileModal from '../../components/modals/PartyProfileModal';
import DayCloseModal from './modals/DayCloseModal';
import AddAccountModal from './modals/AddAccountModal';
import AddPaymentMethodModal from '../../components/modals/AddPaymentMethodModal';
import EditWalletModal from './modals/EditWalletModal';
import FundTransferModal from './modals/FundTransferModal';
import CashFlowModal from './modals/CashFlowModal';
import TransactionDetailsModal from './modals/TransactionDetailsModal';
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
      <div className="flex justify-between items-center flex-wrap gap-2.5 mb-3 pb-2 border-b-[1.5px] border-slate-200">
        {/* Left: Compact Title */}
        <div className="flex items-center gap-2">
          <span className="text-xl">🏦</span>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 m-0 leading-tight">
              Accounts & Ledgers
            </h2>
            <span className="text-slate-500 text-xs">
              Manage cash drawers, banks, ledgers and party accounts
            </span>
          </div>
        </div>

        {/* Center: Integrated Tab Navigation Pills */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => handleSubpageChange('ledgers')}
            className={`py-1.5 px-3 border-0 rounded-md text-xs cursor-pointer flex items-center gap-1.5 transition-all ${
              activeSubpage === 'ledgers'
                ? 'bg-white text-sky-600 font-bold shadow-sm'
                : 'bg-transparent text-slate-500 font-semibold hover:text-slate-700'
            }`}
          >
            <span>📂 Account Ledgers</span>
            <span
              className={`py-px px-1.5 rounded-full text-[0.72rem] font-bold ${
                activeSubpage === 'ledgers' ? 'bg-sky-100 text-sky-600' : 'bg-slate-200 text-slate-500'
              }`}
            >
              {wallets.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSubpageChange('parties')}
            className={`py-1.5 px-3 border-0 rounded-md text-xs cursor-pointer flex items-center gap-1.5 transition-all ${
              activeSubpage === 'parties'
                ? 'bg-white text-sky-600 font-bold shadow-sm'
                : 'bg-transparent text-slate-500 font-semibold hover:text-slate-700'
            }`}
          >
            <span>👥 Parties Ledger</span>
            <span
              className={`py-px px-1.5 rounded-full text-[0.72rem] font-bold ${
                activeSubpage === 'parties' ? 'bg-sky-100 text-sky-600' : 'bg-slate-200 text-slate-500'
              }`}
            >
              {partyCounts.total || parties.length}
            </span>
          </button>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex gap-1.5 items-center flex-wrap">
          <button
            type="button"
            onClick={() => setIsAddAccountOpen(true)}
            className="bg-sky-600 hover:bg-sky-700 text-white border-0 py-1.5 px-3 rounded-md font-bold text-xs cursor-pointer flex items-center gap-1 shadow-sm transition-colors"
          >
            <span>+</span> New Account
          </button>

          <button
            type="button"
            onClick={() => setIsAddPaymentMethodOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 py-1.5 px-3 rounded-md font-bold text-xs cursor-pointer flex items-center gap-1 shadow-sm transition-colors"
          >
            <span>💳</span> Payment Method
          </button>

          <button
            type="button"
            onClick={() => {
              setIsTransferOpen(true);
              setTransferError('');
            }}
            className="bg-cyan-600 hover:bg-cyan-700 text-white border-0 py-1.5 px-3 rounded-md font-bold text-xs cursor-pointer flex items-center gap-1 shadow-sm transition-colors"
          >
            <span>⇄</span> Transfer
          </button>

          <button
            type="button"
            onClick={() => setIsDayCloseOpen(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white border-0 py-1.5 px-3 rounded-md font-bold text-xs cursor-pointer flex items-center gap-1 shadow-sm transition-colors"
          >
            <span>🌅</span> Z-Report
          </button>

          {onNavigateToExpenses && (
            <button
              type="button"
              onClick={onNavigateToExpenses}
              className="bg-white hover:bg-slate-50 border border-slate-300 py-1.5 px-3 rounded-md text-xs text-slate-700 cursor-pointer font-semibold flex items-center gap-1 transition-colors"
            >
              <span>📊</span> Expenses »
            </button>
          )}

          <button
            type="button"
            onClick={loadAccountsData}
            disabled={loading}
            className="bg-white hover:bg-slate-50 border border-slate-300 py-1.5 px-2.5 rounded-md text-xs text-slate-600 cursor-pointer font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
            title="Refresh Ledger"
          >
            <span className={`inline-block transition-transform duration-500 ${loading ? 'rotate-180' : ''}`}>🔄</span>
          </button>
        </div>
      </div>

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

      {/* 4. Central Modals with high zIndex: 10000 */}

      {/* Add Payment Method Modal */}
      <AddPaymentMethodModal
        isOpen={isAddPaymentMethodOpen}
        onClose={() => setIsAddPaymentMethodOpen(false)}
        onSuccess={() => {
          setSuccessMsg('Payment method saved successfully!');
          loadAccountsData();
        }}
      />

      {/* Add Account Modal */}
      <AddAccountModal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
        onSuccess={() => {
          setSuccessMsg('New account created successfully!');
          loadAccountsData();
        }}
      />

      {/* Edit Account Modal */}
      <EditWalletModal
        isOpen={isEditWalletOpen}
        onClose={() => setIsEditWalletOpen(false)}
        editWalletForm={editWalletForm}
        setEditWalletForm={setEditWalletForm}
        tenders={tenders}
        editWalletLoading={editWalletLoading}
        onSubmit={handleSaveWalletEdit}
      />

      {/* Fund Transfer Modal */}
      <FundTransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        transferForm={transferForm}
        setTransferForm={setTransferForm}
        wallets={wallets}
        transferLoading={transferLoading}
        transferError={transferError}
        onSubmit={handleTransferSubmit}
      />

      {/* Deposit / Withdraw Modal */}
      <CashFlowModal
        isOpen={isCashFlowOpen}
        onClose={() => setIsCashFlowOpen(false)}
        cashFlowMode={cashFlowMode}
        cashFlowAccount={cashFlowAccount}
        cashFlowForm={cashFlowForm}
        setCashFlowForm={setCashFlowForm}
        cashFlowLoading={cashFlowLoading}
        cashFlowError={cashFlowError}
        onSubmit={handleCashFlowSubmit}
      />

      {/* Party Profile & Ledgers Modal */}
      {selectedPartyModal.isOpen && (
        <PartyProfileModal
          isOpen={selectedPartyModal.isOpen}
          partyType={selectedPartyModal.partyType}
          partyId={selectedPartyModal.partyId}
          initialTab={selectedPartyModal.initialTab}
          onClose={() => setSelectedPartyModal((prev) => ({ ...prev, isOpen: false }))}
          onPartyUpdated={() => {
            loadPartiesData();
            loadAccountsData();
          }}
        />
      )}

      {/* Daily Cash Closing (Z-Report) Modal */}
      <DayCloseModal isOpen={isDayCloseOpen} onClose={() => setIsDayCloseOpen(false)} />

      {/* View-Only Audit Record & Receipt Details Modal */}
      <TransactionDetailsModal
        tx={selectedTxForDetails}
        onClose={() => setSelectedTxForDetails(null)}
      />
    </div>
  );
}
