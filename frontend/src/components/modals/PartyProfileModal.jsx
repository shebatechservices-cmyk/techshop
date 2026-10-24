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
    {
      id: 'overview',
      label: 'Overview',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: 'financial',
      label: 'Payments',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      id: 'wallet',
      label: 'Wallet',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      badge: `৳${walletBalance.toLocaleString('en-BD', { minimumFractionDigits: walletBalance % 1 !== 0 ? 2 : 0 })}`,
      badgeHighlight: walletBalance > 0,
    },
    {
      id: 'edit',
      label: 'Edit Profile',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    ...(partyType === 'staff'
      ? [
          {
            id: 'activity',
            label: 'Activity',
            icon: (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            ),
          },
        ]
      : []),
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
      className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[84vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <PartyProfileHeader
          profile={profile}
          partyType={partyType}
          balance={balance}
          typeBadgeColors={typeBadgeColors}
          onClose={onClose}
        />

        {/* TAB NAVIGATION: Compact Segmented Pill Bar */}
        <div className="bg-slate-100/90 border-b border-slate-200/90 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-white text-sky-700 shadow-xs border border-slate-200/90 ring-1 ring-slate-900/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 border border-transparent'
                }`}
              >
                <span className={isActive ? 'text-sky-600' : 'text-slate-400'}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      tab.badgeHighlight
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* MODAL BODY */}
        <div className="p-3.5 sm:p-4 overflow-y-auto flex-1 bg-white">
          <PartyTabContent
            manager={manager}
            partyType={partyType}
            balance={balance}
            walletBalance={walletBalance}
          />
        </div>

        {/* MODAL FOOTER */}
        <div className="p-2.5 px-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-3.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
