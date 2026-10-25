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
    <div className="grid grid-cols-2 gap-2.5 px-4 pt-3.5">
      {/* 1. Today's Sale */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-3.5 rounded-2xl shadow-sm flex flex-col justify-between border border-emerald-500/30">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider">আজকের বিক্রি</span>
          <span className="bg-white/20 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold text-white">
            {todayInvoicesCount} টি
          </span>
        </div>
        <div className="mt-2">
          <strong className="text-lg font-black tracking-tight block truncate leading-none">
            {taka(todaySalesTotal)}
          </strong>
          <span className="text-[10px] text-emerald-200 mt-1 block">মোট বিক্রয় মূল্য</span>
        </div>
      </div>

      {/* 2. Today's Collected Cash */}
      <div className="bg-gradient-to-br from-sky-600 to-indigo-700 text-white p-3.5 rounded-2xl shadow-sm flex flex-col justify-between border border-sky-500/30">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-sky-100 uppercase tracking-wider">আজকের আদায়</span>
          <span className="text-sm">💵</span>
        </div>
        <div className="mt-2">
          <strong className="text-lg font-black tracking-tight block truncate leading-none">
            {taka(todayCollectedTotal)}
          </strong>
          <span className="text-[10px] text-sky-200 mt-1 block">নগদ + ডিজিটাল কালেকশন</span>
        </div>
      </div>

      {/* 3. Cash & Bank Balance */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ক্যাশ ব্যালেন্স</span>
          <span className="text-sm">👛</span>
        </div>
        <div className="mt-2">
          <strong className="text-lg font-black tracking-tight text-slate-800 dark:text-slate-100 block truncate leading-none">
            {taka(totalCashInAccounts)}
          </strong>
          <span className="text-[10px] text-slate-400 mt-1 block">হাতে নগদ ও ব্যাংক</span>
        </div>
      </div>

      {/* 4. Customer Due Balance */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">মোট বাকি</span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-600 font-bold">বকেয়া</span>
        </div>
        <div className="mt-2">
          <strong className="text-lg font-black tracking-tight text-rose-600 dark:text-rose-400 block truncate leading-none">
            {taka(totalCustomerDue)}
          </strong>
          <span className="text-[10px] text-slate-400 mt-1 block">গ্রাহকের কাছে পাওনা</span>
        </div>
      </div>
    </div>
  );
}
