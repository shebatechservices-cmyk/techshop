import React from 'react';

export default function WalletTabSelector({
  activeTab = 'projects',
  setActiveTab = () => {},
  projectCount = 0,
  transactionCount = 0
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white p-2 rounded-2xl shadow-sm">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'projects'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>🛠️</span>
          <span>Assigned Projects & Tasks ({projectCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'ledger'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>📜</span>
          <span>Wallet History & Payouts ({transactionCount})</span>
        </button>
      </div>
    </div>
  );
}
