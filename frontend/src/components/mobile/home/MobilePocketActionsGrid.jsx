import React from 'react';

export default function MobilePocketActionsGrid({
  onQuickPos,
  onQuickDue,
  onStockLookup,
  onCameraScan,
  onQuickExpense,
  onDailyRegister,
}) {
  const cards = [
    {
      id: 'pos',
      title: 'নতুন বিক্রি',
      subtitle: '১-স্ক্রিন কুইক POS',
      icon: '⚡',
      color: 'from-emerald-500 to-teal-600',
      action: onQuickPos,
    },
    {
      id: 'due',
      title: 'বকেয়া আদায়',
      subtitle: 'বাকি গ্রহণ ও গার্ড',
      icon: '💵',
      color: 'from-amber-500 to-orange-600',
      action: onQuickDue,
    },
    {
      id: 'stock',
      title: 'স্টক ও দর চেক',
      subtitle: 'দাম ও মজুত লুকআপ',
      icon: '🔍',
      color: 'from-sky-500 to-blue-600',
      action: onStockLookup,
    },
    {
      id: 'scanner',
      title: 'বারকোড স্ক্যানার',
      subtitle: 'মোবাইল ক্যামেরা স্ক্যান',
      icon: '📷',
      color: 'from-purple-500 to-indigo-600',
      action: onCameraScan,
    },
    {
      id: 'expense',
      title: 'খরচ এন্ট্রি',
      subtitle: 'দোকানের খরচ যোগ',
      icon: '💸',
      color: 'from-rose-500 to-pink-600',
      action: onQuickExpense,
    },
    {
      id: 'register',
      title: 'দৈনিক রেজিস্টার',
      subtitle: 'আজকের ক্যাশ ক্লোজিং',
      icon: '📊',
      color: 'from-slate-700 to-slate-900',
      action: onDailyRegister,
    },
  ];

  return (
    <div className="px-4 pt-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 m-0">
          কুইক অ্যাকশন হাব
        </h3>
        <span className="text-[10px] text-slate-400">১-ট্যাপ সেবা</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {cards.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={c.action}
            className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-sm active:scale-95 transition-all text-left"
          >
            <span
              className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${c.color} text-white flex items-center justify-center text-xl shadow-md shrink-0`}
            >
              {c.icon}
            </span>
            <div className="min-w-0">
              <strong className="block text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                {c.title}
              </strong>
              <span className="text-[10px] text-slate-500 truncate block">{c.subtitle}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
