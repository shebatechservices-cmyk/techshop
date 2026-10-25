import React, { useState, useEffect } from 'react';
import {
  TECHNICIAN_MENU_ITEMS,
  getFilteredMenuGroups,
} from './sidebar/sidebarMenuConfig';
import SidebarBrandHeader from './sidebar/SidebarBrandHeader';
import SidebarNavItem from './sidebar/SidebarNavItem';
import SidebarNavGroup from './sidebar/SidebarNavGroup';
import SidebarUserFooter from './sidebar/SidebarUserFooter';
import useSidebarHover from './sidebar/useSidebarHover';

export default function LeftHoverNav({
  activeSlug,
  onSelect,
  shopName = 'Sheba Technology',
  shopLogo,
  currentUser,
  isPinned: propIsPinned,
  onTogglePin,
  isCollapsed: propIsCollapsed,
  onToggleCollapse,
  isAutoHide,
  onToggleAutoHide,
}) {
  const role = (currentUser?.role || 'STAFF').toUpperCase();
  const roleName = (currentUser?.role_name || '').toLowerCase();
  const isSuperAdmin = role === 'ADMIN' || currentUser?.is_admin || roleName.includes('admin');
  const isTechnician = role === 'TECHNICIAN' || roleName.includes('technician') || roleName.includes('tech') || currentUser?.role_id === 4;

  const currentRoleTag = isSuperAdmin ? 'ADMIN' : isTechnician ? 'TECHNICIAN' : 'STAFF';

  // Determine if sidebar is pinned (expanded) or collapsed
  const isPinned =
    propIsPinned !== undefined
      ? Boolean(propIsPinned)
      : propIsCollapsed !== undefined
      ? !propIsCollapsed
      : isAutoHide !== undefined
      ? !isAutoHide
      : false;

  const {
    isHovered,
    isExpanded,
    isCollapsed,
    handleMouseEnter,
    handleMouseLeave,
    handleCloseHover,
  } = useSidebarHover(isPinned);

  const handleTogglePin = onTogglePin || onToggleAutoHide || onToggleCollapse;

  const handleItemSelect = (slug) => {
    if (!isPinned) {
      handleCloseHover();
    }
    if (onSelect) {
      onSelect(slug);
    }
  };

  // Filter menu groups based on RBAC
  const visibleGroups = getFilteredMenuGroups(isSuperAdmin, isTechnician);

  // Identify active group containing the active slug
  const activeGroup =
    visibleGroups.find((g) => g.items.some((it) => it.slug === activeSlug))?.group || 'Main';

  // Auto-Group Accordion Mode
  const [autoAccordion, setAutoAccordion] = useState(() => {
    const saved = localStorage.getItem('sheba_sidebar_accordion');
    return saved !== null ? saved === 'true' : false;
  });

  const [expandedGroups, setExpandedGroups] = useState(() =>
    Object.fromEntries(visibleGroups.map((g) => [g.group, true]))
  );

  // Ensure active group is always open
  useEffect(() => {
    if (activeGroup) {
      setExpandedGroups((prev) => ({ ...prev, [activeGroup]: true }));
    }
  }, [activeSlug, activeGroup]);

  // Shop brand logo state
  const [logoLoadError, setLogoLoadError] = useState(false);
  useEffect(() => {
    setLogoLoadError(false);
  }, [shopLogo]);

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

  return (
    <>
      <div
        className={`hidden md:block flex-shrink-0 transition-all duration-200 ease-in-out ${
          isPinned ? 'w-64' : 'w-16'
        }`}
        aria-hidden="true"
      />
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`top-0 h-screen bg-slate-900 border-r border-slate-800 text-slate-300 transition-all duration-200 ease-in-out flex flex-col select-none hidden md:flex ${
          isPinned
            ? 'w-64 fixed left-0 z-30'
            : isHovered
            ? 'w-64 fixed left-0 z-50 shadow-2xl shadow-slate-950/90 border-r border-slate-700'
            : 'w-16 fixed left-0 z-30'
        }`}
        aria-label="Sidebar Navigation"
      >
        <SidebarBrandHeader
          shopName={shopName}
          shopLogo={shopLogo}
          logoLoadError={logoLoadError}
          onLogoError={() => setLogoLoadError(true)}
          isCollapsed={isCollapsed}
          isPinned={isPinned}
          onTogglePin={handleTogglePin}
        />
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-2.5 custom-scrollbar">
          {isTechnician ? (
            <div className="space-y-1">
              {!isCollapsed && (
                <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider animate-fadeIn">
                  Technician Portal
                </div>
              )}
              {TECHNICIAN_MENU_ITEMS.map((item) => (
                <SidebarNavItem
                  key={item.slug}
                  item={item}
                  isActive={activeSlug === item.slug}
                  isCollapsed={isCollapsed}
                  onSelect={handleItemSelect}
                />
              ))}
            </div>
          ) : (
            visibleGroups.map((grp) => (
              <SidebarNavGroup
                key={grp.group}
                group={grp}
                isGroupOpen={Boolean(expandedGroups[grp.group])}
                isCurrentGroupActive={grp.items.some((it) => it.slug === activeSlug)}
                isCollapsed={isCollapsed}
                activeSlug={activeSlug}
                onToggleGroup={handleToggleGroup}
                onSelect={handleItemSelect}
              />
            ))
          )}
        </div>
        <SidebarUserFooter
          currentUser={currentUser}
          currentRoleTag={currentRoleTag}
          isCollapsed={isCollapsed}
          autoAccordion={autoAccordion}
          onToggleAccordionMode={handleToggleAccordionMode}
        />
      </aside>
    </>
  );
}
