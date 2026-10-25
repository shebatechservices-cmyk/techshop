import React from 'react';

export default function MobilePocketHeader({
  shopName,
  shopLogo,
  onRefresh,
  refreshing,
}) {
  return (
    <header className="bg-slate-900 text-white px-4 py-3.5 shadow-md flex items-center justify-between sticky top-0 z-30 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="flex items-center gap-2.5 min-w-0">
        {shopLogo ? (
          <img
            src={shopLogo}
            alt="Logo"
            className="w-8 h-8 rounded-xl object-contain bg-white/10 p-0.5 border border-white/10 shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-black text-sm flex items-center justify-center shadow-sm shrink-0">
            ⚡
          </div>
        )}
        <h1 className="text-base font-black tracking-tight truncate leading-tight m-0 text-white">
          {shopName || 'Sheba Technology'}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-[10px] font-bold text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>অনলাইন</span>
        </span>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className={`p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-transform active:scale-90 ${
              refreshing ? 'animate-spin text-emerald-400' : ''
            }`}
            title="রিফ্রেশ করুন"
          >
            🔄
          </button>
        )}
      </div>
    </header>
  );
}
