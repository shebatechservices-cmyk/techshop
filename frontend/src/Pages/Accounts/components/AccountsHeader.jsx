import React from 'react';

export default function AccountsHeader({
  activeSubpage,
  handleSubpageChange,
  walletsCount,
  partiesCount,
  onOpenAddAccount,
  onOpenTransfer,
  onOpenDayClose,
  onNavigateToExpenses,
  onRefresh,
  loading,
}) {
  return (
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
            {walletsCount}
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
            {partiesCount}
          </span>
        </button>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex gap-1.5 items-center flex-wrap">
        <button
          type="button"
          onClick={onOpenAddAccount}
          className="bg-sky-600 hover:bg-sky-700 text-white border-0 py-1.5 px-3 rounded-md font-bold text-xs cursor-pointer flex items-center gap-1 shadow-sm transition-colors"
        >
          <span>+</span> New Account
        </button>

        <button
          type="button"
          onClick={onOpenTransfer}
          className="bg-cyan-600 hover:bg-cyan-700 text-white border-0 py-1.5 px-3 rounded-md font-bold text-xs cursor-pointer flex items-center gap-1 shadow-sm transition-colors"
        >
          <span>⇄</span> Transfer
        </button>

        <button
          type="button"
          onClick={onOpenDayClose}
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
          onClick={onRefresh}
          disabled={loading}
          className="bg-white hover:bg-slate-50 border border-slate-300 py-1.5 px-2.5 rounded-md text-xs text-slate-600 cursor-pointer font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
          title="Refresh Ledger"
        >
          <span className={`inline-block transition-transform duration-500 ${loading ? 'rotate-180' : ''}`}>🔄</span>
        </button>
      </div>
    </div>
  );
}
