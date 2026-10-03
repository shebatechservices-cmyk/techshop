import React from 'react';
import { taka } from '../../hooks/usePurchaseCart';

export default function PurchaseFooterActionBar({
  items = [],
  totals = { units: 0, cost: 0, sale: 0 },
  totalCost = 0,
  paid = 0,
  remainingDue = 0,
  estimatedProfit = 0,
  handleClearForm,
  onClose,
  savePurchase,
  saving = false,
  orderToEdit = null,
}) {
  return (
    <footer className="border-t border-slate-100 py-3.5 px-6 bg-white flex justify-between items-center flex-wrap gap-4 mt-2">
      {/* Left Summary Card */}
      <div className="border border-slate-200 rounded-lg py-2 px-4 flex gap-4 text-xs text-slate-600 bg-slate-50 items-center flex-wrap">
        <div>
          Items: <strong className="text-slate-900">{items.length}</strong>
        </div>
        <div>
          Units: <strong className="text-slate-900">{totals.units}</strong>
        </div>
        <div>
          Total Cost: <strong className="text-sky-600">{taka(totalCost)}</strong>
        </div>
        <div>
          Paid: <strong className="text-emerald-600">{taka(paid)}</strong>
        </div>
        <div>
          Due:{' '}
          <strong
            className={remainingDue > 0 ? 'text-rose-600' : 'text-emerald-600'}
          >
            {remainingDue > 0 ? taka(remainingDue) : 'No Due'}
          </strong>
        </div>
        <div>
          Est. Profit: <strong className="text-emerald-600">{taka(estimatedProfit)}</strong>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2.5 items-center">
        <button
          type="button"
          onClick={handleClearForm}
          className="py-2 px-4 rounded-lg border border-slate-300 bg-white text-rose-600 text-sm font-semibold cursor-pointer inline-flex items-center gap-1.5 hover:bg-rose-50 transition-all duration-150"
        >
          🗑️ Clear Form
        </button>

        <button
          type="button"
          onClick={onClose}
          className="py-2 px-4 rounded-lg border border-slate-300 bg-white text-slate-600 text-sm font-semibold cursor-pointer hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={() => savePurchase(true)}
          disabled={saving}
          className="py-2 px-6 rounded-lg border-0 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-bold cursor-pointer shadow-md transition-colors"
        >
          {saving
            ? 'Saving...'
            : orderToEdit && orderToEdit.id
            ? '✓ Edit Save & Preview'
            : '✓ Save & Preview'}
        </button>
      </div>
    </footer>
  );
}
