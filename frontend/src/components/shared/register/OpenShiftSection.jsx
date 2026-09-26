import React from 'react';

export default function OpenShiftSection({
  lastClosedShift,
  openBalance,
  setOpenBalance,
  openNotes,
  setOpenNotes,
  currentUser,
  loading,
  handleOpenShift,
  onClose,
}) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3 mb-5 pb-3.5 border-b border-slate-100">
        <span className="text-3xl">☀️</span>
        <div>
          <h3 className="text-base font-bold text-slate-800">
            Start / Open Cash Register Shift
          </h3>
          <p className="text-xs text-slate-500">
            Set the opening cash drawer balance to begin tracking sales, collections, and expenses.
          </p>
        </div>
      </div>

      {lastClosedShift && (
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-3.5 mb-5 flex justify-between items-center flex-wrap gap-2">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Previous Shift Closing</span>
            <div className="text-sm font-bold text-slate-700">
              Shift #{lastClosedShift.id} ended with ৳{Number(lastClosedShift.actual_cash_counted).toFixed(2)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpenBalance(lastClosedShift.actual_cash_counted || '0')}
            className="py-1 px-2.5 rounded-lg border border-sky-600 bg-sky-50 text-sky-700 text-xs font-semibold hover:bg-sky-100 transition-colors"
          >
            Use Previous Closing Balance
          </button>
        </div>
      )}

      <form onSubmit={handleOpenShift}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              💵 Opening Cash in Drawer <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">৳</span>
              <input
                type="number"
                step="any"
                required
                value={openBalance}
                onChange={(e) => setOpenBalance(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3.5 py-2.5 text-base font-bold rounded-xl border border-slate-300 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              👤 Active Cashier Name
            </label>
            <input
              type="text"
              disabled
              value={currentUser?.name || 'Super Admin'}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed font-medium"
            />
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Opening Shift Remarks (Optional)
          </label>
          <input
            type="text"
            value={openNotes}
            onChange={(e) => setOpenNotes(e.target.value)}
            placeholder="e.g., Morning Shift, Drawer float verified..."
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all text-slate-800"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
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
            className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading ? 'Opening Shift...' : '🟢 Start Register Shift'}
          </button>
        </div>
      </form>
    </div>
  );
}
