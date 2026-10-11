import React from 'react';

export default function SidebarBrandHeader({
  shopName = 'Sheba Technology',
  shopLogo,
  logoLoadError,
  onLogoError,
  isCollapsed,
  onTogglePin,
}) {
  return (
    <div
      className={`h-14 flex items-center border-b border-slate-800 bg-slate-950/40 px-2.5 transition-all ${
        isCollapsed ? 'justify-center' : 'justify-between'
      }`}
    >
      <div className="flex items-center gap-2.5 overflow-hidden">
        <button
          type="button"
          onClick={isCollapsed ? onTogglePin : undefined}
          className={`w-9 h-9 rounded-xl border flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm ml-0.5 transition-all ${
            isCollapsed ? 'cursor-pointer hover:border-brand/60 hover:scale-105' : ''
          } ${
            shopLogo && !logoLoadError
              ? 'bg-white border-slate-700/80 p-0.5'
              : 'bg-brand text-white font-extrabold text-base border-brand/40 shadow-sm'
          }`}
          title={isCollapsed ? 'Expand Sidebar' : shopName}
        >
          {shopLogo && !logoLoadError ? (
            <img
              src={shopLogo}
              alt={shopName}
              className="w-full h-full object-contain"
              onError={onLogoError}
            />
          ) : (
            <span>⚡</span>
          )}
        </button>
        {!isCollapsed && (
          <div className="flex flex-col overflow-hidden animate-fadeIn">
            <span className="text-xs font-bold text-white tracking-wide truncate max-w-[125px]">
              {shopName}
            </span>
            <span className="text-[10px] text-sky-400 font-semibold tracking-wider uppercase">
              ERP & POS
            </span>
          </div>
        )}
      </div>

      {!isCollapsed && onTogglePin && (
        <div className="flex items-center">
          <button
            type="button"
            onClick={onTogglePin}
            className="p-1.5 rounded-lg text-xs transition-colors bg-brand/20 text-brand border border-brand/30 hover:bg-brand/30"
            title="Collapse Sidebar to Icon Rail"
          >
            <span className="text-xs">◀</span>
          </button>
        </div>
      )}
    </div>
  );
}
