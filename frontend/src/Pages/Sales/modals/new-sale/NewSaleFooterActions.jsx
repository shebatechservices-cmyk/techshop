import React from 'react';
import { taka } from '../../hooks/useNewSale';

export default function NewSaleFooterActions({
  items = [],
  totalPayable = 0,
  paid = 0,
  saving,
  editSale,
  handleClearForm,
  handleOpenPrintPreview,
  handleSaveSale,
  onClose,
}) {
  return (
    <div className="py-3.5 px-6 bg-white border-t border-slate-200 flex justify-between items-center">
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          onClick={handleClearForm}
          className="py-2 px-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-rose-600 text-sm font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-colors"
        >
          🗑️ Clear Form
        </button>
        <div className="text-xs text-slate-500">
          <span>{items.length} Items</span> · <span>Payable: <strong className="text-slate-900">{taka(totalPayable)}</strong></span> · <span>Paid: <strong className="text-emerald-600">{taka(paid)}</strong></span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleOpenPrintPreview}
          className="py-2 px-4 rounded-lg border-[1.5px] border-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-sm font-bold cursor-pointer flex items-center gap-1.5 transition-colors"
        >
          🖨️ Print Preview
        </button>
        <button
          type="button"
          onClick={onClose}
          className="py-2 px-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 text-sm font-semibold cursor-pointer transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={handleSaveSale}
          className="py-2 px-6 rounded-lg border-0 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold cursor-pointer shadow-md transition-colors disabled:opacity-50"
        >
          {saving
            ? 'Saving...'
            : editSale && editSale.id
            ? '✓ Edit Save & Preview'
            : '✓ Save & Preview'}
        </button>
      </div>
    </div>
  );
}
