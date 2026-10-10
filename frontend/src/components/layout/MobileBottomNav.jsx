import React from 'react';

export default function MobileBottomNav({
  section,
  isTechnician,
  onNavigate,
  onOpenDrawer,
}) {
  const navItemClass = (isActive) =>
    `mobile-bottom-nav-item flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-150 active:scale-90 select-none ${
      isActive
        ? 'active text-brand font-bold bg-brand-light'
        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium'
    }`;

  return (
    <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] flex items-center justify-around px-2 py-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] md:hidden">
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
            onClick={onOpenDrawer}
            title="Menu"
          >
            <span className="icon text-xl leading-none mb-0.5">☰</span>
            <span className="text-[10px] tracking-tight leading-tight">Menu</span>
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            className={navItemClass(section === 'dashboard')}
            onClick={() => onNavigate({ section: 'dashboard' })}
          >
            <span className="icon text-xl leading-none mb-0.5">📊</span>
            <span className="text-[10px] tracking-tight leading-tight">Dashboard</span>
          </button>
          <button
            type="button"
            className={navItemClass(section === 'sales')}
            onClick={() => onNavigate({ section: 'sales' })}
          >
            <span className="icon text-xl leading-none mb-0.5">🛍️</span>
            <span className="text-[10px] tracking-tight leading-tight">Sales</span>
          </button>
          <button
            type="button"
            className={navItemClass(section === 'purchases')}
            onClick={() => onNavigate({ section: 'purchases' })}
          >
            <span className="icon text-xl leading-none mb-0.5">📦</span>
            <span className="text-[10px] tracking-tight leading-tight">Purchase</span>
          </button>
          <button
            type="button"
            className={navItemClass(section === 'inventory')}
            onClick={() => onNavigate({ section: 'inventory' })}
          >
            <span className="icon text-xl leading-none mb-0.5">🏬</span>
            <span className="text-[10px] tracking-tight leading-tight">Stock</span>
          </button>
          <button
            type="button"
            className={navItemClass(false)}
            onClick={onOpenDrawer}
            title="All Menus"
          >
            <span className="icon text-xl leading-none mb-0.5">☰</span>
            <span className="text-[10px] tracking-tight leading-tight">Menus</span>
          </button>
        </>
      )}
    </nav>
  );
}
