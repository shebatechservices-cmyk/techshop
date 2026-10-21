import React from 'react';

export default function TickerControls({
  itemsLength,
  currentIndex,
  handlePrev,
  handleNext,
  isAdmin,
  onOpenEditModal,
  isCollapsed,
  handleToggleCollapse,
}) {
  return (
    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
      {itemsLength > 1 && (
        <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
          {currentIndex + 1}/{itemsLength}
        </span>
      )}

      {itemsLength > 1 && (
        <div className="flex items-center gap-0.5 bg-slate-800 rounded border border-slate-700 p-0.5">
          <button
            type="button"
            onClick={handlePrev}
            className="px-1.5 py-0.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] font-bold cursor-pointer transition-colors"
            title="Previous Update"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="px-1.5 py-0.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] font-bold cursor-pointer transition-colors"
            title="Next Update"
          >
            ›
          </button>
        </div>
      )}

      {isAdmin && (
        <button
          type="button"
          onClick={onOpenEditModal}
          className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-[10.5px] font-bold cursor-pointer transition-colors flex items-center gap-1"
          title="Edit Customer & Technician Live Offers"
        >
          <span>✏️</span>
          <span className="hidden lg:inline">অফার এডিট</span>
        </button>
      )}

      <button
        type="button"
        onClick={handleToggleCollapse}
        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded cursor-pointer transition-colors text-xs"
        title={isCollapsed ? 'Expand Live Feed' : 'Collapse Live Feed'}
      >
        {isCollapsed ? '▼' : '▲'}
      </button>
    </div>
  );
}
