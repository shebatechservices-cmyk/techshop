import React from 'react';

export default function WarrantyHeader({
  activeTab,
  setActiveTab,
  claimsCount = 0,
  returnsCount = 0,
  onOpenAddClaim,
  onOpenAddReturn,
}) {
  return (
    <div className="flex justify-between items-center flex-wrap gap-3 mb-3 pb-2.5 border-b border-slate-200">
      {/* Left: Title */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">🛡️</span>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Warranty & Returns
        </h1>
      </div>

      {/* Center: Tabs */}
      <div className="flex bg-slate-200/70 p-1 rounded-xl gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('claims')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'claims'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <span>Claims & Service</span>
          <span
            className={`px-1.5 py-0.25 rounded-full text-[11px] font-bold ${
              activeTab === 'claims'
                ? 'bg-white/20 text-white'
                : 'bg-slate-300 text-slate-700'
            }`}
          >
            {claimsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('returns')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'returns'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <span>Returns & Exchanges</span>
          <span
            className={`px-1.5 py-0.25 rounded-full text-[11px] font-bold ${
              activeTab === 'returns'
                ? 'bg-white/20 text-white'
                : 'bg-slate-300 text-slate-700'
            }`}
          >
            {returnsCount}
          </span>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex gap-2 items-center flex-wrap">
        <button
          type="button"
          onClick={onOpenAddClaim}
          className="bg-sky-600 hover:bg-sky-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition cursor-pointer"
        >
          <span className="text-sm font-bold">+</span>
          <span>Receive Item</span>
        </button>
        <button
          type="button"
          onClick={onOpenAddReturn}
          className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer"
        >
          <span>🔄</span>
          <span>Return / Exchange</span>
        </button>
      </div>
    </div>
  );
}
