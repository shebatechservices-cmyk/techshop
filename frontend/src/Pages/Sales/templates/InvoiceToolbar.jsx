import React from 'react';

export default function InvoiceToolbar({
  isQuotation,
  isChalan,
  docNumber,
  paperSize,
  mode,
  setMode,
  handlePrint,
  shareLoading,
  setShowShareModal,
  onClose,
}) {
  return (
    <div
      className="no-print w-full flex flex-wrap justify-between items-center gap-2 p-3 bg-slate-900 text-white rounded-t-2xl shadow-lg border-b border-slate-800 sticky top-0 z-50"
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
                mode === 'invoice' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              মেমো
            </button>
            <button
              type="button"
              onClick={() => setMode('chalan')}
              className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all ${
                mode === 'chalan' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              চালান
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={handlePrint}
          disabled={shareLoading}
          className="px-3 py-1.5 text-xs font-bold bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl flex items-center gap-1 shadow-sm active:scale-95 transition-all"
          title="প্রিন্ট করুন"
        >
          <span>🖨️</span>
          <span>প্রিন্ট</span>
        </button>

        <button
          type="button"
          onClick={() => setShowShareModal(true)}
          disabled={shareLoading}
          className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl flex items-center gap-1 shadow-sm active:scale-95 transition-all"
          title="হোয়াটসঅ্যাপ বা পিডিএফ শেয়ার করুন"
        >
          <span>📤</span>
          <span>শেয়ার</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          disabled={shareLoading}
          className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs active:scale-95 transition-all"
          title="বন্ধ করুন"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
