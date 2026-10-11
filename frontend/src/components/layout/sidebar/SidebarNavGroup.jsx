import React from 'react';
import SidebarNavItem from './SidebarNavItem';

export default function SidebarNavGroup({
  group,
  isGroupOpen,
  isCurrentGroupActive,
  isCollapsed,
  activeSlug,
  onToggleGroup,
  onSelect,
}) {
  return (
    <div className="space-y-1">
      {/* Collapsible Group Header or Divider */}
      {!isCollapsed ? (
        <div className="px-1 pt-1.5 pb-0.5">
          <button
            type="button"
            onClick={() => onToggleGroup(group.group)}
            className={`w-full flex items-center justify-between px-2 py-1 rounded text-[10px] font-extrabold uppercase tracking-wider transition-colors ${
              isCurrentGroupActive
                ? 'text-brand font-bold hover:bg-slate-800/80'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            title={isGroupOpen ? `Collapse ${group.group}` : `Expand ${group.group}`}
          >
            <span className="flex items-center gap-1.5 truncate">
              <span>{group.group}</span>
              {isCurrentGroupActive && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-brand inline-block flex-shrink-0"
                  title="Current active group"
                />
              )}
            </span>
            <span className="flex items-center gap-1.5 flex-shrink-0">
              {!isGroupOpen && (
                <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded-full">
                  {group.items.length}
                </span>
              )}
              <span className="text-[10px] font-mono text-slate-500">
                {isGroupOpen ? '▾' : '▸'}
              </span>
            </span>
          </button>
        </div>
      ) : (
        <div className="w-6 mx-auto border-t border-slate-800/80 my-1.5" />
      )}

      {/* Group Items (Collapsed / Expanded) */}
      {(!isCollapsed ? isGroupOpen : true) && (
        <div className="space-y-1">
          {group.items.map((item) => (
            <SidebarNavItem
              key={item.slug}
              item={item}
              isActive={activeSlug === item.slug}
              isCollapsed={isCollapsed}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
