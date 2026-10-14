import React from 'react';
import useTechWalletModalManager from './techWallet/useTechWalletModalManager';
import TechWalletHeaderBar from './techWallet/TechWalletHeaderBar';
import TechWalletOverviewTab from './techWallet/TechWalletOverviewTab';
import TechPayoutForm from './techWallet/TechPayoutForm';
import TechWalletStatementTab from './techWallet/TechWalletStatementTab';
import TechWalletRequestsTab from './techWallet/TechWalletRequestsTab';

export default function TechWalletModal({ isOpen, onClose, onRefreshProjects }) {
  const {
    activeTab,
    setActiveTab,
    wallets,
    sourceAccounts,
    pendingRequests,
    loading,
    error,
    selectedTechName,
    setSelectedTechName,
    sourceAccountId,
    setSourceAccountId,
    payoutAmount,
    setPayoutAmount,
    payoutNote,
    setPayoutNote,
    submittingPayout,
    statementWalletId,
    statementTechName,
    historyList,
    loadingHistory,
    loadWalletData,
    loadPendingRequests,
    loadHistory,
    initiatePayout,
    handlePayoutSubmit,
  } = useTechWalletModalManager({ isOpen, onRefreshProjects });

  if (!isOpen) return null;

  const totalUnpaidTechBalance = wallets.reduce(
    (sum, w) => sum + parseFloat(w.balance || 0),
    0
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      {/* Print Styles for Voucher */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #payout-voucher-sheet, #payout-voucher-sheet * {
            visibility: visible !important;
          }
          #payout-voucher-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 12mm !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
        }
      `}</style>

      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '820px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          border: '1px solid #cbd5e1',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <TechWalletHeaderBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          wallets={wallets}
          pendingRequests={pendingRequests}
          totalUnpaidTechBalance={totalUnpaidTechBalance}
          onClose={onClose}
        />

        {/* MODAL BODY */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                background: '#fee2e2',
                color: '#b91c1c',
                borderRadius: '8px',
                marginBottom: '14px',
                fontSize: '0.84rem',
              }}
            >
              {error}
            </div>
          )}

          {loading ? (
            <p
              style={{
                textAlign: 'center',
                padding: '40px',
                color: '#64748b',
              }}
            >
              Loading wallet data...
            </p>
          ) : (
            <>
              {activeTab === 'overview' && (
                <TechWalletOverviewTab
                  wallets={wallets}
                  initiatePayout={initiatePayout}
                  loadHistory={loadHistory}
                  setActiveTab={setActiveTab}
                />
              )}

              {activeTab === 'payout' && (
                <TechPayoutForm
                  wallets={wallets}
                  sourceAccounts={sourceAccounts}
                  selectedTechName={selectedTechName}
                  setSelectedTechName={setSelectedTechName}
                  sourceAccountId={sourceAccountId}
                  setSourceAccountId={setSourceAccountId}
                  payoutAmount={payoutAmount}
                  setPayoutAmount={setPayoutAmount}
                  payoutNote={payoutNote}
                  setPayoutNote={setPayoutNote}
                  submittingPayout={submittingPayout}
                  handlePayoutSubmit={handlePayoutSubmit}
                  setActiveTab={setActiveTab}
                />
              )}

              {activeTab === 'statement' && (
                <TechWalletStatementTab
                  wallets={wallets}
                  statementWalletId={statementWalletId}
                  statementTechName={statementTechName}
                  historyList={historyList}
                  loadingHistory={loadingHistory}
                  loadHistory={loadHistory}
                />
              )}

              {activeTab === 'requests' && (
                <TechWalletRequestsTab
                  pendingRequests={pendingRequests}
                  sourceAccounts={sourceAccounts}
                  loadPendingRequests={loadPendingRequests}
                  loadWalletData={loadWalletData}
                  onRefreshProjects={onRefreshProjects}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
