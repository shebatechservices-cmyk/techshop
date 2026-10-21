import React from 'react';

export default function InvoiceToolbar({
  isQuotation,
  isChalan,
  docNumber,
  paperSize,
  pageMargin,
  mode,
  setMode,
  handlePrint,
  shareLoading,
  setShowShareModal,
  onClose,
}) {
  return (
    <div
      className="no-print w-full flex flex-wrap justify-between items-center gap-2 p-3 bg-slate-900 text-white rounded-t-xl shadow-lg border-b border-slate-800"
      style={{
        maxWidth: paperSize === 'thermal_80mm' ? '380px' : (paperSize === 'a5' ? '600px' : '850px'),
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-lg">{isQuotation ? '📋' : '🧾'}</span>
        <div className="truncate">
          <strong className="text-xs sm:text-sm block truncate text-slate-100">
            {isQuotation ? 'Sales Quotation' : (isChalan ? 'Delivery Challan' : 'Sales Receipt')}
          </strong>
          <span className="text-[10px] text-slate-400 block truncate">
            {docNumber} · {paperSize.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 items-center ml-auto">
        {!isQuotation && (
          <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={() => setMode('invoice')}
              className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all ${
                mode === 'invoice' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              Invoice
            </button>
            <button
              type="button"
              onClick={() => setMode('chalan')}
              className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all ${
                mode === 'chalan' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              Chalan
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={handlePrint}
          disabled={shareLoading}
          className="px-2.5 py-1 text-[11px] font-bold bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-lg flex items-center gap-1 shadow-sm transition-all"
        >
          <span>🖨️</span>
          <span className="hidden sm:inline">Print</span>
        </button>

        <button
          type="button"
          onClick={() => setShowShareModal(true)}
          disabled={shareLoading}
          className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg flex items-center gap-1 shadow-sm transition-all"
          title="Share on WhatsApp or Export PDF"
        >
          <span>📤</span>
          <span>Share</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          disabled={shareLoading}
          className="px-2.5 py-1 text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-all"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
