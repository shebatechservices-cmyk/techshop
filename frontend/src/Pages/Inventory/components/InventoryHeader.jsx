import React from 'react';

export default function InventoryHeader({
  readOnly,
  loading,
  loadInventory,
  onOpenQuotation,
  onOpenTransferModal,
}) {
  return (
    <div className="flex justify-between items-center mb-3 pb-2 border-b-[1.5px] border-slate-200 flex-wrap gap-2.5">
      <div className="flex items-center gap-2">
        <span className="text-xl">🏢</span>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 m-0">
              Inventory &amp; Central Warehouse
            </h1>
            <span className="text-[0.7rem] font-bold py-0.5 px-2 rounded-full bg-sky-100 text-sky-700">
              LIVE STOCK
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => onOpenQuotation(null)}
          className="flex items-center gap-1.5 py-1.5 px-3 rounded-md border-0 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-sm transition-colors"
        >
          <span>📝</span> + Create Quotation
        </button>

        {!readOnly && (
          <button
            type="button"
            onClick={() => onOpenTransferModal()}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-md border-0 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer shadow-sm transition-colors"
          >
            <span>🔄</span> Stock Transfer
          </button>
        )}

        <button
          type="button"
          onClick={loadInventory}
          disabled={loading}
          className="flex items-center gap-1.5 py-1.5 px-3 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs cursor-pointer transition-colors disabled:opacity-50"
        >
          <span className={`inline-block transition-transform duration-500 ${loading ? 'rotate-180' : ''}`}>
            🔄
          </span>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    </div>
  );
}
