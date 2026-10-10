import React, { useState, useEffect } from 'react';

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
  isPinned: propIsPinned,
  onTogglePin,
  isCollapsed,
  onToggleCollapse,
  isAutoHide,
  onToggleAutoHide,
  onLogout,
}) {
  const role = (currentUser?.role || 'STAFF').toUpperCase();
  const roleName = (currentUser?.role_name || '').toLowerCase();
  const isSuperAdmin = role === 'ADMIN' || currentUser?.is_admin || roleName.includes('admin');
  const isTechnician =
    role === 'TECHNICIAN' ||
    roleName.includes('technician') ||
    roleName.includes('tech') ||
    currentUser?.role_id === 4;

  const currentRoleTag = isSuperAdmin ? 'ADMIN' : isTechnician ? 'TECHNICIAN' : 'STAFF';

  // If explicitly pinned via prop, otherwise default is false (unpinned = icon rail that expands on hover)
  const isPinned =
    propIsPinned !== undefined
      ? Boolean(propIsPinned)
      : isAutoHide !== undefined
      ? !isAutoHide
      : isCollapsed !== undefined
      ? !isCollapsed
      : false;

  const handleTogglePin = onTogglePin || onToggleAutoHide || onToggleCollapse;

  // Filter menu groups based on RBAC
  const visibleGroups = ERP_MENU_GROUPS.map((group) => {
    const items = group.items.filter((item) => {
      if (item.roles.includes('ADMIN') && isSuperAdmin) return true;
      if (item.roles.includes('STAFF') && !isTechnician) return true;
      return false;
    });
    return { ...group, items };
  }).filter((group) => group.items.length > 0);

  // Identify active group containing the active slug
  const activeGroup =
    visibleGroups.find((g) => g.items.some((it) => it.slug === activeSlug))?.group || 'Main';

  // Auto-Group Accordion Mode: Keeps only the active or clicked group open
  const [autoAccordion, setAutoAccordion] = useState(() => {
    const saved = localStorage.getItem('sheba_sidebar_accordion');
    return saved !== null ? saved === 'true' : true;
  });

  const [expandedGroups, setExpandedGroups] = useState(() => {
    return { [activeGroup]: true };
  });

  // Automatically expand the active group on activeSlug change
  useEffect(() => {
    if (autoAccordion && activeGroup) {
      setExpandedGroups({ [activeGroup]: true });
    } else if (activeGroup) {
      setExpandedGroups((prev) => ({ ...prev, [activeGroup]: true }));
    }
  }, [activeSlug, autoAccordion, activeGroup]);

  // Auto-expansion on hover
  const [isHovered, setIsHovered] = useState(false);
  const effectiveCollapsed = isPinned ? false : !isHovered;

  const handleToggleGroup = (groupName) => {
    if (autoAccordion) {
      setExpandedGroups((prev) => {
        const isOpen = Boolean(prev[groupName]);
        return isOpen ? {} : { [groupName]: true };
      });
    } else {
      setExpandedGroups((prev) => ({
        ...prev,
        [groupName]: !prev[groupName],
      }));
    }
  };

  const handleToggleAccordionMode = () => {
    const next = !autoAccordion;
    setAutoAccordion(next);
    localStorage.setItem('sheba_sidebar_accordion', String(next));
    if (next && activeGroup) {
      setExpandedGroups({ [activeGroup]: true });
    }
  };

  const handleItemClick = (slug) => {
    onSelect(slug);
    if (!isPinned) {
      setIsHovered(false);
    }
  };

  return (
    <aside
      onMouseEnter={() => !isPinned && setIsHovered(true)}
      onMouseLeave={() => !isPinned && setIsHovered(false)}
      className={`sticky top-0 h-screen z-40 bg-slate-900 border-r border-slate-800 text-slate-300 transition-all duration-200 ease-in-out flex flex-col select-none hidden md:flex flex-shrink-0 ${
        effectiveCollapsed ? 'w-16' : 'w-64'
      } ${!isPinned && isHovered ? 'shadow-xl ring-1 ring-sky-500/20' : ''}`}
      aria-label="Sidebar Navigation"
    >
      {/* Brand Header */}
      <div
        className={`h-14 flex items-center border-b border-slate-800 bg-slate-950/40 transition-all ${
          effectiveCollapsed ? 'justify-center px-2' : 'justify-between px-3'
        }`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div
            className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 border border-sky-400/40 flex items-center justify-center text-white font-extrabold text-base flex-shrink-0 shadow-sm"
            title={shopName}
          >
            ⚡
          </div>
          {!effectiveCollapsed && (
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

        {!effectiveCollapsed && handleTogglePin && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleTogglePin}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                !isPinned
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={
                !isPinned
                  ? 'Auto-Hide Active (Hover to expand). Click to Pin sidebar'
                  : 'Pinned wide. Click to unpin (Hover to expand)'
              }
            >
              <span className="text-xs">{!isPinned ? '⚡' : '📌'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-3 custom-scrollbar">
        {isTechnician ? (
          <div className="space-y-1">
            {!effectiveCollapsed && (
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
                  onClick={() => handleItemClick(item.slug)}
                  title={effectiveCollapsed ? item.label : undefined}
                  className={`flex items-center transition-all ${
                    effectiveCollapsed
                      ? `w-11 h-10 mx-auto justify-center rounded-xl ${
                          isActive
                            ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`
                      : `w-full gap-3 px-2.5 py-2 rounded-lg text-xs font-medium ${
                          isActive
                            ? 'bg-sky-600 text-white font-semibold shadow-sm'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`
                  }`}
                >
                  <span className="text-base flex-shrink-0">{item.icon}</span>
                  {!effectiveCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>
        ) : (
          visibleGroups.map((grp) => {
            const isGroupOpen = Boolean(expandedGroups[grp.group]);
            const isCurrentGroupActive = grp.items.some((it) => it.slug === activeSlug);

            return (
              <div key={grp.group} className="space-y-1">
                {/* Collapsible Group Header or Divider */}
                {!effectiveCollapsed ? (
                  <div className="px-1 py-0.5">
                    <button
                      type="button"
                      onClick={() => handleToggleGroup(grp.group)}
                      className={`w-full flex items-center justify-between px-2 py-1 rounded text-[10px] font-extrabold uppercase tracking-wider transition-colors ${
                        isCurrentGroupActive
                          ? 'text-sky-400 hover:bg-slate-800/80'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                      title={isGroupOpen ? `Collapse ${grp.group}` : `Expand ${grp.group}`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <span>{grp.group}</span>
                        {isCurrentGroupActive && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block flex-shrink-0"
                            title="Current active group"
                          />
                        )}
                      </span>
                      <span className="flex items-center gap-1.5 flex-shrink-0">
                        {!isGroupOpen && (
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded-full">
                            {grp.items.length}
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-500">
                          {isGroupOpen ? '▾' : '▸'}
                        </span>
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="w-8 mx-auto border-t border-slate-800/80 my-2" />
                )}

                {/* Group Items (Collapsed / Expanded) */}
                {(!effectiveCollapsed ? isGroupOpen : true) && (
                  <div className="space-y-1">
                    {grp.items.map((item) => {
                      const isActive = activeSlug === item.slug;
                      return (
                        <button
                          key={item.slug}
                          type="button"
                          onClick={() => handleItemClick(item.slug)}
                          title={effectiveCollapsed ? item.label : undefined}
                          className={`flex items-center transition-all ${
                            effectiveCollapsed
                              ? `w-11 h-10 mx-auto justify-center rounded-xl ${
                                  isActive
                                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`
                              : `w-full gap-3 px-2.5 py-2 rounded-lg text-xs font-medium ${
                                  isActive
                                    ? 'bg-sky-600 text-white font-semibold shadow-sm'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`
                          }`}
                        >
                          <span className="text-base flex-shrink-0">{item.icon}</span>
                          {!effectiveCollapsed && <span className="truncate">{item.label}</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Controls & User Summary */}
      <div
        className={`p-2 border-t border-slate-800 bg-slate-950/40 transition-all ${
          effectiveCollapsed ? 'flex justify-center' : 'space-y-1.5'
        }`}
      >
        {/* Quick Mode Indicator / Toggle when expanded */}
        {!effectiveCollapsed && (
          <div className="flex items-center justify-between px-2 py-1 text-[10px] text-slate-400 border-b border-slate-800/60 pb-1.5">
            <span className="truncate">Auto-Accordion Groups</span>
            <button
              type="button"
              onClick={handleToggleAccordionMode}
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors ${
                autoAccordion
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title="When ON, opening a group automatically closes other groups to save space"
            >
              {autoAccordion ? 'ON' : 'OFF'}
            </button>
          </div>
        )}

        <div
          className={`flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors ${
            effectiveCollapsed ? 'justify-center' : ''
          }`}
          title={effectiveCollapsed ? `${currentUser?.name || 'Logged User'} (${currentRoleTag})` : undefined}
        >
          <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-inner">
            {(currentUser?.name || 'U').charAt(0).toUpperCase()}
          </div>
          {!effectiveCollapsed && (
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
