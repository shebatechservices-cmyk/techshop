import React from 'react';

export default function SidebarNavItem({
  item,
  isActive,
  isCollapsed,
  onSelect,
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.slug)}
      title={isCollapsed ? item.label : undefined}
      className={`w-full flex items-center h-10 rounded-xl transition-colors duration-150 ${
        isActive
          ? 'bg-brand text-white font-bold shadow-sm shadow-brand/30'
          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
      } ${
        isCollapsed
          ? 'justify-center px-0'
          : 'px-2 gap-2.5'
      }`}
    >
      <span className="w-8 h-8 flex items-center justify-center text-lg flex-shrink-0">
        {item.icon}
      </span>
      {!isCollapsed && (
        <span className="truncate flex-1 text-left text-xs font-semibold animate-fadeIn">
          {item.label}
        </span>
      )}
    </button>
  );
}
