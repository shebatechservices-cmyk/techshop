import React from 'react';

// Grouped ERP Mobile Navigation Structure
const ERP_DRAWER_GROUPS = [
  {
    group: 'Main',
    items: [
      { slug: 'dashboard', label: 'Dashboard', icon: '📊', desc: 'Overview & Key Metrics', roles: ['ADMIN', 'STAFF'] },
    ],
  },
  {
    group: 'Operations',
    items: [
      { slug: 'sales', label: 'Sales & POS', icon: '💰', desc: 'Invoices, POS & Customer Ledger', roles: ['ADMIN', 'STAFF'] },
      { slug: 'purchases', label: 'Purchases', icon: '🛒', desc: 'Purchase Orders & Supplier Ledgers', roles: ['ADMIN', 'STAFF'] },
      { slug: 'inventory', label: 'Inventory & Stock', icon: '🏢', desc: 'Live Stock & Warehouses', roles: ['ADMIN', 'STAFF'] },
      { slug: 'products', label: 'Products & Catalog', icon: '📦', desc: 'Product Master & Categories', roles: ['ADMIN', 'STAFF'] },
    ],
  },
  {
    group: 'Financials',
    items: [
      { slug: 'accounts', label: 'Accounts & Ledgers', icon: '💳', desc: 'Bank Accounts & Transactions', roles: ['ADMIN', 'STAFF'] },
      { slug: 'expenses', label: 'Expenses', icon: '💸', desc: 'Daily Expenses & Operating Costs', roles: ['ADMIN', 'STAFF'] },
    ],
  },
  {
    group: 'Services & Commerce',
    items: [
      { slug: 'projects', label: 'Projects & Services', icon: '🛠️', desc: 'CCTV & Service Work Orders', roles: ['ADMIN', 'STAFF'] },
      { slug: 'ecommerce', label: 'E-Commerce', icon: '🌐', desc: 'Online Orders & Storefront', roles: ['ADMIN', 'STAFF'] },
      { slug: 'warranty', label: 'Warranty & RMA', icon: '🏷️', desc: 'Serial Verification & Claims', roles: ['ADMIN', 'STAFF'] },
    ],
  },
  {
    group: 'Administration',
    items: [
      { slug: 'staff', label: 'Staff Management', icon: '👥', desc: 'Team Members, Roles & Access', roles: ['ADMIN'] },
      { slug: 'reports', label: 'Reports & Analytics', icon: '📈', desc: 'Profit/Loss, Sales & Stock Reports', roles: ['ADMIN', 'STAFF'] },
      { slug: 'soc', label: 'SOC Security', icon: '🛡️', desc: 'Security Audits & Activity Logs', roles: ['ADMIN'] },
      { slug: 'settings', label: 'Settings', icon: '⚙️', desc: 'Shop Profile, Printing & Backup', roles: ['ADMIN'] },
      { slug: 'trash', label: 'Trash', icon: '🗑️', desc: 'Deleted & Archived Records', roles: ['ADMIN'] },
    ],
  },
];

const TECHNICIAN_DRAWER_ITEMS = [
  { slug: 'projects', label: 'Projects & Services', icon: '🛠️', desc: 'Assigned Tasks & Service Work' },
  { slug: 'inventory', label: 'Inventory (Prices)', icon: '🏢', desc: 'Product Stock & Price Lookup' },
  { slug: 'wallet', label: 'My Wallet & Earnings', icon: '👛', desc: 'Personal Commission & Balance' },
];

export default function MobileNavDrawer({
  isOpen,
  onClose,
  activeSlug,
  onSelect,
  shopName = 'Sheba Technology',
  userName = 'Super Admin',
  currentUser,
  onLogout,
}) {
  if (!isOpen) return null;

  const role = (currentUser?.role || 'STAFF').toUpperCase();
  const roleName = (currentUser?.role_name || '').toLowerCase();
  const isSuperAdmin = role === 'ADMIN' || currentUser?.is_admin || roleName.includes('admin');
  const isTechnician = role === 'TECHNICIAN' || roleName.includes('technician') || roleName.includes('tech') || currentUser?.role_id === 4;

  const currentRoleTag = isSuperAdmin ? 'ADMIN' : (isTechnician ? 'TECHNICIAN' : 'STAFF');

  const visibleGroups = ERP_DRAWER_GROUPS.map((group) => {
    const items = group.items.filter((item) => {
      if (item.roles.includes('ADMIN') && isSuperAdmin) return true;
      if (item.roles.includes('STAFF') && !isTechnician) return true;
      return false;
    });
    return { ...group, items };
  }).filter((group) => group.items.length > 0);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-start md:hidden animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-4/5 max-w-xs h-full bg-slate-900 text-white flex flex-col shadow-2xl border-r border-slate-800 animate-slideRight"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
      >
        {/* Drawer Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 font-extrabold text-base">
              ⚡
            </div>
            <div>
              <h4 className="text-sm font-bold text-white truncate max-w-[170px]">{shopName}</h4>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="truncate">{userName}</span>
                <span className="text-[9px] bg-slate-800 text-sky-400 px-1.5 py-0.5 rounded border border-slate-700">
                  {currentRoleTag}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={onClose}
            aria-label="Close Drawer"
          >
            ✕
          </button>
        </div>

        {/* Drawer Navigation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {isTechnician ? (
            <div className="space-y-1">
              <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Technician Portal
              </div>
              {TECHNICIAN_DRAWER_ITEMS.map((item) => {
                const isActive = activeSlug === item.slug;
                return (
                  <button
                    key={item.slug}
                    type="button"
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${
                      isActive
                        ? 'bg-sky-600 text-white font-bold shadow'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                    onClick={() => {
                      onSelect(item.slug);
                      onClose();
                    }}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <div className="flex-1 overflow-hidden">
                      <div className="text-xs font-bold leading-tight">{item.label}</div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            visibleGroups.map((grp) => (
              <div key={grp.group} className="space-y-1">
                <div className="px-2 pb-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  {grp.group}
                </div>
                {grp.items.map((item) => {
                  const isActive = activeSlug === item.slug;
                  return (
                    <button
                      key={item.slug}
                      type="button"
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${
                        isActive
                          ? 'bg-sky-600 text-white font-bold shadow'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                      onClick={() => {
                        onSelect(item.slug);
                        onClose();
                      }}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <div className="flex-1 overflow-hidden">
                        <div className="text-xs font-bold leading-tight">{item.label}</div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">{item.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {onLogout && (
          <div className="p-3 border-t border-slate-800 bg-slate-950">
            <button
              type="button"
              className="w-full py-2.5 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              onClick={() => {
                onClose();
                onLogout();
              }}
            >
              <span>🚪</span>
              <span>Log Out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
