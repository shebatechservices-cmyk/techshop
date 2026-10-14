import React from 'react';

export default function AttributeCatalogHeader({
  totalAttributesCount,
  panels,
  selectedEntityFilter,
  setSelectedEntityFilter,
  onOpenManageUom,
}) {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center flex-wrap gap-4">
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-600 block mb-0.5">
          Master Data Catalog
        </span>
        <h2 className="text-lg font-extrabold text-slate-900">Categories & Attributes</h2>
        <p className="text-xs text-slate-500">
          Configure classifications, manufacturers, and hardware specifications for products.
        </p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={onOpenManageUom}
          className="bg-white hover:bg-sky-50 border border-sky-300 text-sky-700 font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <span>📏</span>
          <span>Manage Units (UOM)</span>
        </button>
        <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedEntityFilter("ALL")}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              selectedEntityFilter === "ALL"
                ? "bg-sky-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            All ({totalAttributesCount})
          </button>
          {panels.map((p) => (
            <button
              key={p.entity}
              type="button"
              onClick={() =>
                setSelectedEntityFilter(selectedEntityFilter === p.entity ? "ALL" : p.entity)
              }
              className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                selectedEntityFilter === p.entity
                  ? "bg-sky-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
              title={`Filter by ${p.title}`}
            >
              {p.title} ({p.items.length})
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
