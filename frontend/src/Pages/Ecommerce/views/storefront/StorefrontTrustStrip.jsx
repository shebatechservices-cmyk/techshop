import React from 'react';

export default function StorefrontTrustStrip() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 p-3 rounded-xl flex items-center gap-2.5 shadow-xs">
        <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg shrink-0">
          🚚
        </span>
        <div>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
            সারা দেশে ডেলিভারি
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            ক্যাশ অন ডেলিভারি (Steadfast &amp; Pathao)
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 p-3 rounded-xl flex items-center gap-2.5 shadow-xs">
        <span className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center text-lg shrink-0">
          🛡️
        </span>
        <div>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
            ১০০% জেনুইন গ্যাজেট
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            ব্র্যান্ড ওয়ারেন্টি ও রিপ্লেসমেন্ট
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 p-3 rounded-xl flex items-center gap-2.5 shadow-xs">
        <span className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg shrink-0">
          🔄
        </span>
        <div>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
            সহজ রিটার্ন ও সাপোর্ট
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            টেকনিক্যাল হেল্প ও কনফিগারেশন
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 p-3 rounded-xl flex items-center gap-2.5 shadow-xs">
        <span className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg shrink-0">
          ⚡
        </span>
        <div>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
            ইনস্ট্যান্ট অর্ডার
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            লগইন ছাড়াই ১-ক্লিকে চেকআউট
          </div>
        </div>
      </div>
    </div>
  );
}
