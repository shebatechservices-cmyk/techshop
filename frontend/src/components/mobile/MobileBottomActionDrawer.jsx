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
      title: 'সেল (POS)',
      subtitle: '১-স্ক্রিন কুইক বিক্রি ও মেমো',
      icon: '⚡',
      color: 'from-emerald-500 to-teal-600',
      badge: 'POS Sale',
    },
    {
      id: 'purchase',
      title: 'পারচেজ',
      subtitle: 'নতুন পণ্য ক্রয় ও স্টক ইন',
      icon: '🛒',
      color: 'from-blue-600 to-indigo-600',
      badge: 'Purchase',
    },
    {
      id: 'due',
      title: 'ডিউ কালেক্ট',
      subtitle: 'বকেয়া গ্রহণ ও গার্ড',
      icon: '💵',
      color: 'from-amber-500 to-orange-600',
      badge: 'Due Collect',
    },
    {
      id: 'projects',
      title: 'প্রজেক্ট ও সার্ভিস',
      subtitle: 'সার্ভিসিং টিকিট ও টাস্ক',
      icon: '🛠️',
      color: 'from-cyan-600 to-blue-700',
      badge: 'Projects',
    },
    {
      id: 'accounts',
      title: 'একাউন্টস',
      subtitle: 'ক্যাশ, ব্যাংক ও লেজার',
      icon: '👛',
      color: 'from-teal-600 to-emerald-700',
      badge: 'Accounts',
    },
    {
      id: 'staff',
      title: 'স্টাফ ম্যানেজমেন্ট',
      subtitle: 'কর্মচারী ও পারমিশন',
      icon: '👥',
      color: 'from-purple-600 to-indigo-700',
      badge: 'Staff & HR',
    },
    {
      id: 'settings',
      title: 'সেটিং',
      subtitle: 'শপ প্রোফাইল ও প্রিন্টার',
      icon: '⚙️',
      color: 'from-slate-700 to-slate-900',
      badge: 'Settings',
    },
    {
      id: 'stock',
      title: 'স্টক ও দর চেক',
      subtitle: 'মজুত পণ্য ও মূল্য লুকআপ',
      icon: '🔍',
      color: 'from-sky-500 to-blue-600',
      badge: 'Stock Lookup',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[9990] bg-slate-950/70 backdrop-blur-sm flex flex-col justify-end transition-opacity duration-200"
      onClick={onClose}
    >
      {/* Drawer Sheet */}
      <div
        className="bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl border-t border-slate-200 dark:border-slate-800 max-h-[85vh] flex flex-col animate-slideUp overflow-hidden pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Indicator Handle */}
        <div className="flex flex-col items-center pt-3 pb-1 cursor-pointer" onClick={onClose}>
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg">
              🏪
            </span>
            <div>
              <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm tracking-tight m-0">
                শপ ম্যানেজমেন্ট হাব
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
        <div className="p-4 grid grid-cols-2 gap-2.5 overflow-y-auto max-h-[58vh]">
          {actions.map((act) => (
            <button
              key={act.id}
              type="button"
              onClick={() => onSelectAction(act.id)}
              className="flex flex-col text-left p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 active:scale-95 transition-all shadow-sm group"
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <span className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${act.color} text-white flex items-center justify-center text-base shadow-sm`}>
                  {act.icon}
                </span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {act.badge}
                </span>
              </div>
              <span className="font-extrabold text-slate-800 dark:text-slate-100 text-xs mb-0.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {act.title}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                {act.subtitle}
              </span>
            </button>
          ))}
        </div>

        {/* Footer: View Mode Switcher */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">📱</span>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              ভিউ মোড: {viewMode === 'mobile' ? 'মোবাইল পকেট' : 'ফুল ডেক্সটপ'}
            </span>
          </div>
          <button
            type="button"
            onClick={onToggleViewMode}
            className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-sm active:scale-95 transition-all"
          >
            {viewMode === 'mobile' ? '🖥️ ডেক্সটপ ভিউ' : '📱 মোবাইল ভিউ'}
          </button>
        </div>
      </div>
    </div>
  );
}
