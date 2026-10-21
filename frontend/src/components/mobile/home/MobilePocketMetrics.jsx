import React from 'react';

const taka = (v) => `৳ ${Number(v || 0).toLocaleString('en-BD', { minimumFractionDigits: 0 })}`;

export default function MobilePocketMetrics({ stats }) {
  const {
    todaySalesTotal = 0,
    todayInvoicesCount = 0,
    todayCollectedTotal = 0,
    totalCustomerDue = 0,
    totalCashInAccounts = 0,
  } = stats || {};

  return (
    <div className="grid grid-cols-2 gap-2.5 px-4 pt-3">
      {/* Today Sales */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-3 rounded-2xl shadow-md flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider">আজকের বিক্রি</span>
          <span className="text-sm bg-white/20 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold">
            {todayInvoicesCount} টি
          </span>
        </div>
        <strong className="text-base font-black tracking-tight mt-1 truncate">
          {taka(todaySalesTotal)}
        </strong>
      </div>

      {/* Cash In Hand / Wallets */}
      <div className="bg-gradient-to-br from-sky-600 to-indigo-700 text-white p-3 rounded-2xl shadow-md flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-sky-100 uppercase tracking-wider">ক্যাশ ব্যালেন্স</span>
          <span className="text-sm">👛</span>
        </div>
        <strong className="text-base font-black tracking-tight mt-1 truncate">
          {taka(totalCashInAccounts)}
        </strong>
      </div>

      {/* Today Collected */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">আজকের আদায়</span>
        <strong className="text-base font-black tracking-tight text-emerald-600 dark:text-emerald-400 mt-1 truncate">
          {taka(todayCollectedTotal)}
        </strong>
      </div>

      {/* Customer Due Balance */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">মোট গ্রাহক বাকি</span>
        <strong className="text-base font-black tracking-tight text-rose-600 dark:text-rose-400 mt-1 truncate">
          {taka(totalCustomerDue)}
        </strong>
      </div>
    </div>
  );
}
