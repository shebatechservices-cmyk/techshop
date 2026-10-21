import React from 'react';

export default function MobileBottomActionDrawer({
  isOpen,
  onClose,
  onSelectAction,
  viewMode,
  onToggleViewMode,
}) {
  if (!isOpen) return null;

  const actions = [
    {
      id: 'pos',
      title: 'কুইক বিক্রি',
      subtitle: '১-স্ক্রিন দ্রুত বিক্রয়',
      icon: '⚡',
      color: 'from-emerald-500 to-teal-600',
      badge: 'Fast POS',
    },
    {
      id: 'due',
      title: 'বকেয়া আদায়',
      subtitle: 'গ্রাহকের বাকি সংগ্রহ',
      icon: '💵',
      color: 'from-amber-500 to-orange-600',
      badge: 'Due Guard',
    },
    {
      id: 'stock',
      title: 'স্টক ও দর চেক',
      subtitle: 'দাম ও মজুত অনুসন্ধান',
      icon: '🔍',
      color: 'from-sky-500 to-blue-600',
      badge: 'Instant',
    },
    {
      id: 'scanner',
      title: 'ক্যামেরা স্ক্যানার',
      subtitle: 'মোবাইল ক্যামেরা দিয়ে স্ক্যান',
      icon: '📷',
      color: 'from-purple-500 to-indigo-600',
      badge: 'Barcode',
    },
    {
      id: 'expense',
      title: 'কুইক খরচ',
      subtitle: 'দোকানের খরচ এন্ট্রি',
      icon: '💸',
      color: 'from-rose-500 to-pink-600',
      badge: 'Expense',
    },
    {
      id: 'register',
      title: 'দৈনিক রেজিস্টার',
      subtitle: 'আজকের ক্যাশ ও হিসাব',
      icon: '📊',
      color: 'from-slate-700 to-slate-900',
      badge: 'Cash Drawer',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[9990] bg-slate-950/60 backdrop-blur-sm flex flex-col justify-end transition-opacity duration-200"
      onClick={onClose}
    >
      {/* Drawer Sheet */}
      <div
        className="bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl border-t border-slate-200 dark:border-slate-800 max-h-[88vh] flex flex-col animate-slideUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag / Pull Indicator Handle */}
        <div className="flex flex-col items-center pt-3 pb-1 cursor-pointer" onClick={onClose}>
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-2.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚀</span>
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm tracking-tight m-0">
                কুইক অ্যাকশন হাব (Pocket Edition)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0">
                প্রয়োজনীয় কাজ দ্রুত সম্পন্ন করুন
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center font-bold text-sm transition-colors border-0 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Action Grid */}
        <div className="p-4 grid grid-cols-2 gap-3 overflow-y-auto max-h-[55vh]">
          {actions.map((act) => (
            <button
              key={act.id}
              type="button"
              onClick={() => onSelectAction(act.id)}
              className="flex flex-col text-left p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 active:scale-95 transition-all shadow-sm group"
            >
              <div className="flex items-center justify-between w-full mb-2">
                <span className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${act.color} text-white flex items-center justify-center text-lg shadow-md`}>
                  {act.icon}
                </span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {act.badge}
                </span>
              </div>
              <span className="font-bold text-slate-800 dark:text-slate-100 text-xs mb-0.5 group-hover:text-sky-600 transition-colors">
                {act.title}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                {act.subtitle}
              </span>
            </button>
          ))}
        </div>

        {/* Footer: View Switcher */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs">🖥️</span>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              ভিউ মোড: {viewMode === 'mobile' ? 'মোবাইল পকেট' : 'ফুল ডেক্সটপ'}
            </span>
          </div>
          <button
            type="button"
            onClick={onToggleViewMode}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-sm active:scale-95 transition-all"
          >
            {viewMode === 'mobile' ? '🖥️ ডেক্সটপ ভিউ' : '📱 মোবাইল ভিউ'}
          </button>
        </div>
      </div>
    </div>
  );
}
