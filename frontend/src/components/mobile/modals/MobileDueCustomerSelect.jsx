import React from 'react';

const taka = (v) => `৳ ${Number(v || 0).toLocaleString('en-BD', { minimumFractionDigits: 0 })}`;

export default function MobileDueCustomerSelect({
  search,
  setSearch,
  filteredCustomers,
  onSelectCustomer,
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
        গ্রাহক খুঁজুন (নাম বা ফোন):
      </label>
      <input
        type="text"
        placeholder="কাস্টমার নাম বা মোবাইল নম্বর..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
        autoFocus
      />
      <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800">
        {filteredCustomers.map((c) => {
          const due = Number(c.receivable_balance ?? c.due_balance ?? c.due ?? 0);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectCustomer(c)}
              className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center justify-between transition-colors"
            >
              <div>
                <strong className="block text-xs text-slate-800 dark:text-slate-100">{c.name}</strong>
                <span className="text-[10px] text-slate-500">{c.phone || 'ফোন নেই'}</span>
              </div>
              <span className={`text-xs font-black ${due > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                বাকি: {taka(due)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
