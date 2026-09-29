import React from 'react';

export default function WalletStatsCards({ summary = {} }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Main Available Balance */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow-lg shadow-emerald-700/20 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
            Available Wallet Balance
          </span>
          <span className="text-xl">💰</span>
        </div>
        <div className="mt-3">
          <div className="text-3xl font-black tracking-tight">
            ৳{parseFloat(summary.walletBalance || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-100/80 mt-1">
            Ready for cash payout / withdrawal
          </p>
        </div>
      </div>

      {/* Total Earned Commissions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
          <span>Project Earnings</span>
          <span className="text-lg">🛠️</span>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-slate-900">
            ৳{parseFloat(summary.totalEarnedCommission || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Lifetime commission & allowances
          </p>
        </div>
      </div>

      {/* Completed Projects */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
          <span>Completed Tasks</span>
          <span className="text-lg">✅</span>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-emerald-600">
            {summary.completedProjects || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Finished service & installation jobs
          </p>
        </div>
      </div>

      {/* Ongoing Projects */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
          <span>Ongoing Tasks</span>
          <span className="text-lg">⏳</span>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-amber-600">
            {summary.ongoingProjects || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Currently assigned service calls
          </p>
        </div>
      </div>
    </div>
  );
}
