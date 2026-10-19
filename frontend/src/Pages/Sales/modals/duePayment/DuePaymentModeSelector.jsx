import React from 'react';

export default function DuePaymentModeSelector({
  paymentMode,
  handleModeChange,
  saleDue,
  customerTotalDue,
  taka
}) {
  return (
    <div className="px-5 pt-4 flex gap-2">
      <button
        type="button"
        onClick={() => handleModeChange('single')}
        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
          paymentMode === 'single'
            ? 'border-sky-500 bg-sky-50 text-sky-800 ring-2 ring-sky-100'
            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
        }`}
      >
        📄 This Invoice Due ({taka(saleDue)})
      </button>
      <button
        type="button"
        onClick={() => handleModeChange('bulk')}
        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
          paymentMode === 'bulk'
            ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-100'
            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
        }`}
      >
        👥 Customer Total Due ({taka(customerTotalDue)})
      </button>
    </div>
  );
}
