import React from 'react';
import PartyOverviewTab from './PartyOverviewTab';
import PartyFinancialTab from './PartyFinancialTab';
import PartyWalletTab from './PartyWalletTab';
import PartyEditTab from './PartyEditTab';
import PartyActivityTab from './PartyActivityTab';

export default function PartyTabContent({
  manager,
  partyType,
  balance,
  walletBalance,
}) {
  const {
    activeTab,
    loading,
    profileData,
    wallets,
    error,
    successMsg,
    editForm,
    setEditForm,
    editLoading,
    finAction,
    setFinAction,
    finForm,
    setFinForm,
    finLoading,
    finError,
    setFinError,
    finSuccess,
    setFinSuccess,
    walletData,
    walletAction,
    setWalletAction,
    walletForm,
    setWalletForm,
    walletLoading,
    walletError,
    setWalletError,
    walletSuccess,
    setWalletSuccess,
    deleteLoading,
    deleteError,
    handleEditSubmit,
    handleFinSubmit,
    handleWalletSubmit,
    handleDeleteParty,
    walletNeedsAccount,
  } = manager;

  if (loading) {
    return (
      <div className="text-center py-10 text-slate-500 text-xs">
        <div className="text-base font-semibold mb-1">⏳ Loading profile details...</div>
        <small>Querying database for party ledgers and audit records</small>
      </div>
    );
  }

  return (
    <>
      {activeTab === 'overview' && (
        <PartyOverviewTab
          profileData={profileData}
          partyType={partyType}
        />
      )}

      {activeTab === 'financial' && (
        <PartyFinancialTab
          partyType={partyType}
          finAction={finAction}
          setFinAction={setFinAction}
          finForm={finForm}
          setFinForm={setFinForm}
          finLoading={finLoading}
          finError={finError}
          setFinError={setFinError}
          finSuccess={finSuccess}
          setFinSuccess={setFinSuccess}
          balance={balance}
          wallets={wallets}
          handleFinSubmit={handleFinSubmit}
        />
      )}

      {activeTab === 'wallet' && (
        <PartyWalletTab
          partyType={partyType}
          walletBalance={walletBalance}
          balance={balance}
          walletAction={walletAction}
          setWalletAction={setWalletAction}
          walletForm={walletForm}
          setWalletForm={setWalletForm}
          walletLoading={walletLoading}
          walletError={walletError}
          setWalletError={setWalletError}
          walletSuccess={walletSuccess}
          setWalletSuccess={setWalletSuccess}
          wallets={wallets}
          walletData={walletData}
          walletNeedsAccount={walletNeedsAccount}
          handleWalletSubmit={handleWalletSubmit}
        />
      )}

      {activeTab === 'edit' && (
        <PartyEditTab
          partyType={partyType}
          editForm={editForm}
          setEditForm={setEditForm}
          editLoading={editLoading}
          error={error}
          successMsg={successMsg}
          handleEditSubmit={handleEditSubmit}
        />
      )}

      {partyType === 'staff' && activeTab === 'activity' && (
        <PartyActivityTab
          profileData={profileData}
          balance={balance}
          deleteError={deleteError}
          deleteLoading={deleteLoading}
          handleDeleteParty={handleDeleteParty}
        />
      )}
    </>
  );
}
