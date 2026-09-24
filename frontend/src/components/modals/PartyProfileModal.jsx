import React from 'react';
import { usePartyProfileManager } from '../hooks/usePartyProfileManager';
import PartyOverviewTab from '../shared/party/PartyOverviewTab';
import PartyFinancialTab from '../shared/party/PartyFinancialTab';
import PartyWalletTab from '../shared/party/PartyWalletTab';
import PartyEditTab from '../shared/party/PartyEditTab';
import PartyActivityTab from '../shared/party/PartyActivityTab';

export default function PartyProfileModal({
  isOpen,
  onClose,
  partyType = 'customer',
  partyId,
  onPartyUpdated,
  initialTab = 'overview',
}) {
  const manager = usePartyProfileManager({
    isOpen,
    partyType,
    partyId,
    onPartyUpdated,
    initialTab,
    onClose,
  });

  if (!isOpen) return null;

  const {
    activeTab,
    setActiveTab,
    loading,
    profileData,
    wallets,
    error,
    setError,
    successMsg,
    setSuccessMsg,
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

  const profile = profileData?.profile || {};
  const balance = parseFloat(profile.balance || 0);
  const walletBalance = parseFloat(walletData?.party?.wallet_balance || profile.wallet_balance || 0);

  const typeBadgeColors = {
    customer: { bg: 'bg-sky-100', text: 'text-sky-800', label: 'Customer' },
    supplier: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Supplier' },
    staff: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Staff' },
  }[partyType] || { bg: 'bg-slate-100', text: 'text-slate-800', label: partyType };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="p-5 sm:p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white flex justify-between items-center flex-wrap gap-4 border-b border-slate-700">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl ${typeBadgeColors.bg} ${typeBadgeColors.text} flex items-center justify-center text-xl font-extrabold shadow-lg flex-shrink-0`}
            >
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {profile.name || 'Loading Profile...'}
                </h3>
                <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${typeBadgeColors.bg} ${typeBadgeColors.text}`}>
                  {typeBadgeColors.label}
                </span>
                <span className="text-xs text-slate-400">#{profile.id}</span>
              </div>
              <div className="flex gap-3 mt-1 text-xs text-slate-300 flex-wrap">
                {profile.phone && <span>📞 {profile.phone}</span>}
                {profile.email && <span>✉️ {profile.email}</span>}
                {profile.role_or_type && (
                  <span className="bg-white/10 px-2 py-0.5 rounded text-[11px]">
                    🏷️ {profile.role_or_type}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Balance & Close Button */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                {partyType === 'customer'
                  ? (balance > 0 ? 'Receivable Due (পাওনা)' : balance < 0 ? 'Advance Credit (অগ্রিম)' : 'Balance')
                  : partyType === 'supplier'
                  ? (balance > 0 ? 'Payable Due (সাপ্লায়ারের পাওনা)' : balance < 0 ? 'Advance Given (অগ্রিম প্রদান)' : 'Balance')
                  : 'Account Balance'}
              </div>
              <div
                className={`text-xl font-extrabold ${
                  balance > 0
                    ? (partyType === 'customer' ? 'text-rose-400' : 'text-amber-400')
                    : 'text-emerald-400'
                }`}
              >
                ৳ {balance.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-white/10 hover:bg-white/20 text-white w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex bg-slate-50 border-b border-slate-200 px-4 overflow-x-auto">
          {[
            { id: 'overview', label: '📊 Overview & Ledger' },
            { id: 'financial', label: '💳 Financial Actions' },
            { id: 'wallet', label: `👛 Wallet (৳ ${walletBalance.toLocaleString('en-BD', { minimumFractionDigits: 2 })})` },
            { id: 'edit', label: '✏️ Edit Profile' },
            { id: 'activity', label: '🛡️ Activity & Delete' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setError('');
                setSuccessMsg('');
                setFinError('');
                setFinSuccess('');
              }}
              className={`py-3 px-4 font-semibold text-xs whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-sky-600 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* MODAL BODY */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-white">
          {loading ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              <div className="text-base font-semibold mb-1">⏳ Loading profile details...</div>
              <small>Querying database for party ledgers and audit records</small>
            </div>
          ) : (
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

              {activeTab === 'activity' && (
                <PartyActivityTab
                  profileData={profileData}
                  balance={balance}
                  deleteError={deleteError}
                  deleteLoading={deleteLoading}
                  handleDeleteParty={handleDeleteParty}
                />
              )}
            </>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3.5 px-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 bg-white border border-slate-300 rounded-xl text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
