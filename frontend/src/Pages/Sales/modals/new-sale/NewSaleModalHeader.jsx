import React from 'react';

export default function NewSaleModalHeader({
  editSale,
  autoFocusEnabled,
  toggleAutoFocus,
  onClose,
}) {
  return (
    <div className="px-6 py-3.5 bg-white border-b border-gray-200 flex justify-between items-center gap-3">
      <div className="flex items-center gap-3">
        <span className="text-2xl text-gray-500">{editSale ? '✏️' : '🛒'}</span>
        <div>
          <h3 className="m-0 text-lg font-bold text-gray-900">
            {editSale ? `Edit Sale Invoice #${editSale.invoice_no || editSale.id}` : 'New POS Sale & Invoice'}
          </h3>
          <p className="m-0 text-xs text-gray-500 mt-0.5">
            {editSale
              ? 'Editing is only allowed within 7 days of the original sale. Stock, serials & payments are re-settled automatically.'
              : 'Instant point of sale, barcode scanning, loyalty points, and multi-tender payments'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        {/* Auto-Focus Toggle */}
        <button
          type="button"
          onClick={toggleAutoFocus}
          title={autoFocusEnabled ? 'Auto-focus is ON: Click to disable' : 'Auto-focus is OFF: Click to enable'}
          className={`flex items-center gap-1.5 text-[11px] font-semibold py-1 px-2.5 rounded-lg border transition-all cursor-pointer ${
            autoFocusEnabled
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 shadow-sm'
              : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${autoFocusEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
          <span>Auto-Focus: {autoFocusEnabled ? 'ON' : 'OFF'}</span>
        </button>

        <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 py-1 px-2.5 rounded-lg">
          <span>⚡ Shortcuts:</span>
          <kbd className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-mono text-[10px] text-slate-800">F2</kbd> <span>Scan</span>
          <kbd className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-mono text-[10px] text-slate-800">F3</kbd> <span>Customer</span>
          <kbd className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-mono text-[10px] text-slate-800">Ctrl+Enter</kbd> <span>Pay</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
          title="Close modal"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
