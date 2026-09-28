import React from 'react';
import PartyProfileModal from '../../../components/modals/PartyProfileModal';
import DayCloseModal from '../modals/DayCloseModal';
import AddAccountModal from '../modals/AddAccountModal';
import AddPaymentMethodModal from '../../../components/modals/AddPaymentMethodModal';
import EditWalletModal from '../modals/EditWalletModal';
import FundTransferModal from '../modals/FundTransferModal';
import CashFlowModal from '../modals/CashFlowModal';
import TransactionDetailsModal from '../modals/TransactionDetailsModal';

export default function AccountsModalsContainer({
  isAddPaymentMethodOpen,
  setIsAddPaymentMethodOpen,
  isAddAccountOpen,
  setIsAddAccountOpen,
  isEditWalletOpen,
  setIsEditWalletOpen,
  editWalletForm,
  setEditWalletForm,
  tenders,
  editWalletLoading,
  handleSaveWalletEdit,
  isTransferOpen,
  setIsTransferOpen,
  transferForm,
  setTransferForm,
  wallets,
  transferLoading,
  transferError,
  handleTransferSubmit,
  isCashFlowOpen,
  setIsCashFlowOpen,
  cashFlowMode,
  cashFlowAccount,
  cashFlowForm,
  setCashFlowForm,
  cashFlowLoading,
  cashFlowError,
  handleCashFlowSubmit,
  selectedPartyModal,
  setSelectedPartyModal,
  loadPartiesData,
  loadAccountsData,
  setSuccessMsg,
  isDayCloseOpen,
  setIsDayCloseOpen,
  selectedTxForDetails,
  setSelectedTxForDetails,
}) {
  return (
    <>
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
    </>
  );
}
