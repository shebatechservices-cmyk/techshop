import React from 'react';

export default function MobileBottomNav({
  section,
  isTechnician,
  onNavigate,
  onOpenDrawer,
  onOpenActionDrawer,
}) {
  const navItemClass = (isActive) =>
    `mobile-bottom-nav-item flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 active:scale-90 select-none ${
      isActive
        ? 'active text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-50 dark:bg-emerald-950/40'
        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium'
    }`;

  return (
    <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] flex items-center justify-around px-2 py-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden">
      {isTechnician ? (
        <>
          <button
            type="button"
            className={navItemClass(section === 'projects')}
            onClick={() => onNavigate({ section: 'projects' })}
          >
            <span className="icon text-xl leading-none mb-0.5">🛠️</span>
            <span className="text-[10px] tracking-tight leading-tight">Projects</span>
          </button>
          <button
            type="button"
            className={navItemClass(section === 'ecommerce')}
            onClick={() => onNavigate({ section: 'ecommerce' })}
          >
            <span className="icon text-xl leading-none mb-0.5">🌐</span>
            <span className="text-[10px] tracking-tight leading-tight">E-Com</span>
          </button>
          <button
            type="button"
            className={navItemClass(section === 'warranty')}
            onClick={() => onNavigate({ section: 'warranty' })}
          >
            <span className="icon text-xl leading-none mb-0.5">🏷️</span>
            <span className="text-[10px] tracking-tight leading-tight">Warranty</span>
          </button>
          <button
            type="button"
            className={navItemClass(section === 'wallet')}
            onClick={() => onNavigate({ section: 'wallet' })}
          >
            <span className="icon text-xl leading-none mb-0.5">👛</span>
            <span className="text-[10px] tracking-tight leading-tight">Wallet</span>
          </button>
          <button
            type="button"
            className={navItemClass(false)}
            onClick={onOpenActionDrawer || onOpenDrawer}
            title="Shop Menu"
          >
            <span className="icon text-xl leading-none mb-0.5">🏪</span>
            <span className="text-[10px] tracking-tight leading-tight font-bold text-emerald-600">শপ</span>
          </button>
        </>
      ) : (
        <>
          {/* 1. Dashboard */}
          <button
            type="button"
            className={navItemClass(section === 'dashboard')}
            onClick={() => onNavigate({ section: 'dashboard' })}
          >
            <span className="icon text-xl leading-none mb-0.5">📊</span>
            <span className="text-[10px] tracking-tight leading-tight">ড্যাশবোর্ড</span>
          </button>

          {/* 2. Sales List */}
          <button
            type="button"
            className={navItemClass(section === 'sales')}
            onClick={() => onNavigate({ section: 'sales' })}
          >
            <span className="icon text-xl leading-none mb-0.5">🛍️</span>
            <span className="text-[10px] tracking-tight leading-tight">বিক্রি</span>
          </button>

          {/* 3. Inventory / Stock */}
          <button
            type="button"
            className={navItemClass(section === 'inventory' || section === 'products')}
            onClick={() => onNavigate({ section: 'inventory' })}
          >
            <span className="icon text-xl leading-none mb-0.5">📦</span>
            <span className="text-[10px] tracking-tight leading-tight">স্টক</span>
          </button>

          {/* 4. Accounts */}
          <button
            type="button"
            className={navItemClass(section === 'accounts')}
            onClick={() => onNavigate({ section: 'accounts' })}
          >
            <span className="icon text-xl leading-none mb-0.5">👛</span>
            <span className="text-[10px] tracking-tight leading-tight">হিসাব</span>
          </button>

          {/* 5. Highlighted Right-Side SHOP Button */}
          <button
            type="button"
            className="flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl select-none cursor-pointer active:scale-90 transition-all text-emerald-600 dark:text-emerald-400 font-extrabold"
            onClick={onOpenActionDrawer}
            title="শপ মেনু ও অ্যাকশন হাব"
          >
            <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center text-lg shadow-md shadow-emerald-500/30 mb-0.5 border border-white/20">
              🏪
            </span>
            <span className="text-[10px] font-black tracking-tight leading-tight text-emerald-600 dark:text-emerald-400">
              শপ মেনু
            </span>
          </button>
        </>
      )}
    </nav>
  );
}
