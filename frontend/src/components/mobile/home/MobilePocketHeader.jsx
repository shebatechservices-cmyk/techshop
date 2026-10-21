import React from 'react';

export default function MobilePocketHeader({
  shopName,
  shopLogo,
  userName,
  userRole,
  onToggleDesktopView,
  onOpenMenu,
  onRefresh,
  refreshing,
}) {
  return (
    <header className="bg-slate-900 text-white px-4 py-3 shadow-md flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-2.5 min-w-0">
        {shopLogo ? (
          <img src={shopLogo} alt="Logo" className="w-9 h-9 rounded-xl object-contain bg-white/10 p-1" />
        ) : (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
            ⚡
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-sm font-black tracking-tight truncate leading-tight m-0 text-white">
            {shopName || 'Sheba Technology'}
          </h2>
          <span className="text-[10px] text-sky-300 font-semibold truncate block">
            {userName} • <span className="uppercase text-[9px] text-slate-400">{userRole}</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className={`p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-transform ${
            refreshing ? 'animate-spin text-sky-400' : ''
          }`}
          title="রিফ্রেশ করুন"
        >
          🔄
        </button>

        <button
          type="button"
          onClick={onToggleDesktopView}
          className="px-2.5 py-1.5 bg-sky-600/90 hover:bg-sky-500 text-white font-bold text-[11px] rounded-xl flex items-center gap-1 shadow-sm active:scale-95 transition-all"
          title="পূর্ণাঙ্গ ডেক্সটপ ভিউতে যান"
        >
          <span>🖥️</span>
          <span>ডেক্সটপ</span>
        </button>

        <button
          type="button"
          onClick={onOpenMenu}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-base transition-colors"
          title="সব মেনু"
        >
          ☰
        </button>
      </div>
    </header>
  );
}
