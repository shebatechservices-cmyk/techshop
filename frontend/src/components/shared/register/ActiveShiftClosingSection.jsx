import React from 'react';
import { DENOMINATIONS } from '../../hooks/useRegisterClosingManager';

export default function ActiveShiftClosingSection({
  currentShift,
  denominations,
  handleDenominationChange,
  actualCashCounted,
  setActualCashCounted,
  closingNotes,
  setClosingNotes,
  loading,
  handleCloseShift,
  onClose,
}) {
  return (
    <div>
      {/* Shift Information Pill */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 mb-5 flex items-center justify-between shadow-sm flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg text-xs font-bold">
              🟢 ACTIVE SHIFT #{currentShift.id}
            </span>
            <span className="text-xs text-slate-500">
              Opened at: {new Date(currentShift.opened_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} ({new Date(currentShift.opened_at).toLocaleDateString()})
            </span>
          </div>
          <div className="mt-1.5 text-sm text-slate-700 font-semibold">
            Cashier: {currentShift.opened_by_name || 'Admin'} • Opening Drawer: ৳{Number(currentShift.opening_balance).toFixed(2)}
          </div>
        </div>

        <div className="text-right">
          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">PROTOCOL</div>
          <div className="text-xs text-sky-600 font-bold">Blind Close Enforced</div>
        </div>
      </div>

      {/* Blind Close Banner */}
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 mb-5 flex items-center gap-3">
        <span className="text-2xl">🛡️</span>
        <div className="text-xs text-sky-900 leading-relaxed">
          <strong>Blind Close Mode Active:</strong> কাউন্ট করার সময় সিস্টেম প্রত্যাশিত ব্যালেন্স প্রকাশ করে না। আপনার ক্যাশ ড্রয়ারের প্রকৃত টাকা গুণে এন্ট্রি করুন। সমাপ্ত করার পর স্বয়ংক্রিয়ভাবে অডিট রিপোর্ট ও এসএমএস প্রেরিত হবে।
        </div>
      </div>

      <form onSubmit={handleCloseShift}>
        {/* Denomination Counter Grid */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 mb-5 shadow-sm">
          <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              💵 Currency Denomination Counter (নোট ও কয়েন কাউন্টার)
            </h4>
            <span className="text-xs text-slate-400">Bangladeshi Taka (৳)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {DENOMINATIONS.map((denom) => {
              const count = denominations[denom] || '';
              const lineTotal = Number(denom) * (parseInt(count, 10) || 0);
              return (
                <div
                  key={denom}
                  className={`p-2.5 rounded-xl border transition-all ${
                    count ? 'bg-sky-50/70 border-sky-300' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-700">৳{denom}</span>
                    {lineTotal > 0 && (
                      <span className="text-[11px] font-bold text-sky-600">৳{lineTotal.toLocaleString()}</span>
                    )}
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder="Qty"
                    value={count}
                    onChange={(e) => handleDenominationChange(denom, e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-right outline-none focus:border-sky-500 bg-white"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Total Cash Input & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              🎯 Total Actual Cash Counted (মোট গণনা করা ক্যাশ) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">৳</span>
              <input
                type="number"
                step="any"
                required
                value={actualCashCounted}
                onChange={(e) => setActualCashCounted(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3.5 py-2.5 text-lg font-extrabold rounded-xl border-2 border-sky-500 bg-slate-50 text-slate-900 outline-none focus:ring-2 focus:ring-sky-100 transition-all"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500">
              Auto-filled by denomination counter or entered directly.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              📝 Shift Closing Notes / Remarks (মন্তব্য)
            </label>
            <textarea
              rows="3"
              value={closingNotes}
              onChange={(e) => setClosingNotes(e.target.value)}
              placeholder="e.g., Cash handed over to Manager, petty cash retained..."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
            />
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-slate-300 bg-white text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="py-2.5 px-6 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-lg shadow-sky-600/25 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? 'Reconciling & Closing...' : '🔒 Finalize & Close Register'}
          </button>
        </div>
      </form>
    </div>
  );
}
