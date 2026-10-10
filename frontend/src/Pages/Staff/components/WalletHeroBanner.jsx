import React from 'react';

export default function WalletHeroBanner({
  currentUser,
  userId,
  loading = false,
  fetchWallet = () => {},
  onOpenRequestModal = () => {},
}) {
  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
      <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-300 flex items-center justify-center text-3xl font-bold shadow-inner flex-shrink-0">
            👛
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                {currentUser?.name || 'Technician Portal'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-400/40">
                FIELD TECHNICIAN
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {currentUser?.phone || currentUser?.email || 'Technician ID: #' + userId} • Personal Earnings, Task Commissions & Wallet Statement
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={onOpenRequestModal}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>💸</span>
            <span>উইথড্র / ডিপোজিট রিকোয়েস্ট</span>
          </button>
          <button
            type="button"
            onClick={fetchWallet}
            disabled={loading}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/15 flex items-center gap-2 cursor-pointer"
          >
            <span className={loading ? 'animate-spin' : ''}>🔄</span>
            <span>Refresh Balance</span>
          </button>
        </div>
      </div>
    </div>
  );
}
