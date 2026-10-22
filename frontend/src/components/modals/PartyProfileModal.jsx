import React from 'react';
import { usePartyProfileManager } from '../hooks/usePartyProfileManager';
import PartyProfileHeader from '../shared/party/PartyProfileHeader';
import PartyTabContent from '../shared/party/PartyTabContent';

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
    profileData,
    setError,
    setSuccessMsg,
    setFinError,
    setFinSuccess,
    walletData,
  } = manager;

  const profile = profileData?.profile || {};
  const balance = parseFloat(profile.balance || 0);
  const walletBalance = parseFloat(
    walletData?.party?.wallet_balance || profile.wallet_balance || 0
  );

  const typeBadgeColors = {
    customer: { bg: 'bg-sky-100', text: 'text-sky-800', label: 'Customer' },
    supplier: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Supplier' },
    staff: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Staff' },
  }[partyType] || { bg: 'bg-slate-100', text: 'text-slate-800', label: partyType };

  const tabs = [
    { id: 'overview', label: '📊 Overview & Ledger' },
    { id: 'financial', label: '💳 Financial Actions' },
    {
      id: 'wallet',
      label: `👛 Wallet (৳ ${walletBalance.toLocaleString('en-BD', { minimumFractionDigits: 2 })})`,
    },
    { id: 'edit', label: '✏️ Edit Profile' },
    ...(partyType === 'staff' ? [{ id: 'activity', label: '🛡️ Activity & Delete' }] : []),
  ];

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setError('');
    setSuccessMsg('');
    setFinError('');
    setFinSuccess('');
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <PartyProfileHeader
          profile={profile}
          partyType={partyType}
          balance={balance}
          typeBadgeColors={typeBadgeColors}
          onClose={onClose}
        />

        {/* TAB NAVIGATION */}
        <div className="flex bg-slate-50 border-b border-slate-200 px-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
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
          <PartyTabContent
            manager={manager}
            partyType={partyType}
            balance={balance}
            walletBalance={walletBalance}
          />
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
