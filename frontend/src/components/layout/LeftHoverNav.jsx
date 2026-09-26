import React, { useState } from 'react';

// Grouped ERP Navigation Architecture
const ERP_MENU_GROUPS = [
  {
    group: 'Main',
    roles: ['ADMIN', 'STAFF'],
    items: [
      { slug: 'dashboard', label: 'Dashboard', icon: '📊', roles: ['ADMIN', 'STAFF'] },
    ],
  },
  {
    group: 'Operations',
    roles: ['ADMIN', 'STAFF'],
    items: [
      { slug: 'sales', label: 'Sales & POS', icon: '💰', roles: ['ADMIN', 'STAFF'] },
      { slug: 'purchases', label: 'Purchases', icon: '🛒', roles: ['ADMIN', 'STAFF'] },
      { slug: 'inventory', label: 'Inventory & Stock', icon: '🏢', roles: ['ADMIN', 'STAFF'] },
      { slug: 'products', label: 'Products & Catalog', icon: '📦', roles: ['ADMIN', 'STAFF'] },
    ],
  },
  {
    group: 'Financials',
    roles: ['ADMIN', 'STAFF'],
    items: [
      { slug: 'accounts', label: 'Accounts & Ledgers', icon: '💳', roles: ['ADMIN', 'STAFF'] },
      { slug: 'expenses', label: 'Expenses', icon: '💸', roles: ['ADMIN', 'STAFF'] },
    ],
  },
  {
    group: 'Services & Commerce',
    roles: ['ADMIN', 'STAFF'],
    items: [
      { slug: 'projects', label: 'Projects & Services', icon: '🛠️', roles: ['ADMIN', 'STAFF'] },
      { slug: 'ecommerce', label: 'E-Commerce', icon: '🌐', roles: ['ADMIN', 'STAFF'] },
      { slug: 'warranty', label: 'Warranty & RMA', icon: '🏷️', roles: ['ADMIN', 'STAFF'] },
    ],
  },
  {
    group: 'Administration',
    roles: ['ADMIN', 'STAFF'],
    items: [
      { slug: 'staff', label: 'Staff Management', icon: '👥', roles: ['ADMIN'] },
      { slug: 'reports', label: 'Reports & Analytics', icon: '📈', roles: ['ADMIN', 'STAFF'] },
      { slug: 'soc', label: 'SOC Security', icon: '🛡️', roles: ['ADMIN'] },
      { slug: 'settings', label: 'Settings', icon: '⚙️', roles: ['ADMIN'] },
      { slug: 'trash', label: 'Trash', icon: '🗑️', roles: ['ADMIN'] },
    ],
  },
];

const TECHNICIAN_MENU_ITEMS = [
  { slug: 'projects', label: 'Projects & Services', icon: '🛠️' },
  { slug: 'inventory', label: 'Inventory (Prices)', icon: '🏢' },
  { slug: 'wallet', label: 'My Wallet & Earnings', icon: '👛' },
];

export default function LeftHoverNav({
  activeSlug,
  onSelect,
  shopName = 'Sheba Technology',
  currentUser,
  isCollapsed = false,
  onToggleCollapse,
  onLogout,
}) {
  const role = (currentUser?.role || 'STAFF').toUpperCase();
  const roleName = (currentUser?.role_name || '').toLowerCase();
  const isSuperAdmin = role === 'ADMIN' || currentUser?.is_admin || roleName.includes('admin');
  const isTechnician = role === 'TECHNICIAN' || roleName.includes('technician') || roleName.includes('tech') || currentUser?.role_id === 4;

  const currentRoleTag = isSuperAdmin ? 'ADMIN' : (isTechnician ? 'TECHNICIAN' : 'STAFF');

  // Filter menu groups based on RBAC
  const visibleGroups = ERP_MENU_GROUPS.map((group) => {
    const items = group.items.filter((item) => {
      if (item.roles.includes('ADMIN') && isSuperAdmin) return true;
      if (item.roles.includes('STAFF') && !isTechnician) return true;
      return false;
    });
    return { ...group, items };
  }).filter((group) => group.items.length > 0);

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-slate-900 border-r border-slate-800 text-slate-300 transition-all duration-200 ease-in-out flex flex-col select-none hidden md:flex ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
      aria-label="Sidebar Navigation"
    >
      {/* Brand Header */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 font-extrabold text-sm flex-shrink-0">
            ⚡
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-bold text-white tracking-wide truncate">
                {shopName}
              </span>
              <span className="text-[10px] text-sky-400 font-semibold tracking-wider uppercase">
                ERP & POS
              </span>
            </div>
          )}
        </div>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <span className="text-xs font-mono">{isCollapsed ? '❯' : '❮'}</span>
          </button>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4 custom-scrollbar">
        {isTechnician ? (
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Technician Portal
              </div>
            )}
            {TECHNICIAN_MENU_ITEMS.map((item) => {
              const isActive = activeSlug === item.slug;
              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => onSelect(item.slug)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-sky-600 text-white font-semibold shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <span className="text-base flex-shrink-0">{item.icon}</span>
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>
        ) : (
          visibleGroups.map((grp) => (
            <div key={grp.group} className="space-y-1">
              {!isCollapsed && (
                <div className="px-2 pb-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  {grp.group}
                </div>
              )}
              {grp.items.map((item) => {
                const isActive = activeSlug === item.slug;
                return (
                  <button
                    key={item.slug}
                    type="button"
                    onClick={() => onSelect(item.slug)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-sky-600 text-white font-semibold shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  >
                    <span className="text-base flex-shrink-0">{item.icon}</span>
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* User Footer Summary */}
      <div className="p-2 border-t border-slate-800 bg-slate-950/40">
        <div
          className={`flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <div className="w-7 h-7 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {(currentUser?.name || 'U').charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <div className="text-xs font-semibold text-white truncate">
                {currentUser?.name || 'Logged User'}
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                <span className="truncate">{currentRoleTag}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
