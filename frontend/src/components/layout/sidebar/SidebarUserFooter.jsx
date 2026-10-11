import React from 'react';

export default function SidebarUserFooter({
  currentUser,
  currentRoleTag,
  isCollapsed,
  autoAccordion,
  onToggleAccordionMode,
}) {
  return (
    <div
      className={`p-2 border-t border-slate-800 bg-slate-950/40 transition-all ${
        isCollapsed ? 'flex justify-center' : 'space-y-1.5'
      }`}
    >
      {/* Quick Mode Indicator / Toggle when expanded */}
      {!isCollapsed && (
        <div className="flex items-center justify-between px-2 py-1 text-[10px] text-slate-400 border-b border-slate-800/60 pb-1.5">
          <span className="truncate">Auto-Accordion Groups</span>
          <button
            type="button"
            onClick={onToggleAccordionMode}
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors ${
              autoAccordion
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
            title="When ON, opening a group automatically closes other groups"
          >
            {autoAccordion ? 'ON' : 'OFF'}
          </button>
        </div>
      )}

      <div
        className={`flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors ${
          isCollapsed ? 'justify-center' : ''
        }`}
        title={isCollapsed ? `${currentUser?.name || 'Logged User'} (${currentRoleTag})` : undefined}
      >
        <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-inner">
          {(currentUser?.name || 'U').charAt(0).toUpperCase()}
        </div>
        {!isCollapsed && (
          <div className="flex-1 overflow-hidden animate-fadeIn">
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
  );
}
