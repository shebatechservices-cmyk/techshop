import React from 'react';

export default function ShiftClosedSummarySection({
  closedSummary,
  handlePrintSlip,
  setClosedSummary,
  fetchCurrentShift,
}) {
  const variance = Number(closedSummary.shift.variance_amount || 0);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">🎉</span>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Shift Closed & Locked Successfully
            </h3>
            <p className="text-xs text-slate-500">
              Shift #{closedSummary.shift.id} • Closed by {closedSummary.shift.closed_by_name}
            </p>
          </div>
        </div>

        {/* Variance Badge */}
        <div>
          {variance === 0 ? (
            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-3.5 py-1 rounded-full font-bold text-xs">
              ✓ Balanced (৳0.00)
            </span>
          ) : variance > 0 ? (
            <span className="bg-sky-100 text-sky-800 border border-sky-300 px-3.5 py-1 rounded-full font-bold text-xs">
              ▲ Overage (+৳{variance.toFixed(2)})
            </span>
          ) : (
            <span className="bg-rose-100 text-rose-800 border border-rose-300 px-3.5 py-1 rounded-full font-bold text-xs">
              ▼ Shortage (৳{variance.toFixed(2)})
            </span>
          )}
        </div>
      </div>

      {/* SMS Alert Status Box */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">📱</span>
          <div>
            <strong className="text-xs text-emerald-900">Automated SMS Alert Status:</strong>
            <div className="text-xs text-emerald-700">
              {closedSummary.sms_recipient
                ? `SMS notification dispatched to Store Owner/Admin (${closedSummary.sms_recipient})`
                : 'Owner phone not configured in Settings.'}
            </div>
          </div>
        </div>
        <span className="text-xs bg-emerald-200 text-emerald-900 px-2.5 py-1 rounded-md font-bold">
          SENT
        </span>
      </div>

      {/* Shift Audit Table */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Opening Cash</span>
          <div className="text-lg font-bold text-slate-700">৳{Number(closedSummary.shift.opening_balance).toFixed(2)}</div>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Cash Sales</span>
          <div className="text-lg font-bold text-sky-600">৳{Number(closedSummary.shift.total_cash_sales).toFixed(2)}</div>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Due Collections</span>
          <div className="text-lg font-bold text-emerald-600">৳{Number(closedSummary.shift.total_due_collections).toFixed(2)}</div>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Cash Expenses / Refunds</span>
          <div className="text-lg font-bold text-rose-600">৳{Number(closedSummary.shift.total_cash_expenses).toFixed(2)}</div>
        </div>

        <div className="bg-slate-100 p-3.5 rounded-xl border border-slate-300">
          <span className="text-[11px] text-slate-700 uppercase font-extrabold tracking-wider">Expected Drawer Cash</span>
          <div className="text-xl font-extrabold text-slate-900">৳{Number(closedSummary.shift.expected_cash_balance).toFixed(2)}</div>
        </div>

        <div className="bg-slate-100 p-3.5 rounded-xl border border-slate-300">
          <span className="text-[11px] text-slate-700 uppercase font-extrabold tracking-wider">Actual Cash Counted</span>
          <div className="text-xl font-extrabold text-slate-900">৳{Number(closedSummary.shift.actual_cash_counted).toFixed(2)}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-3.5 border-t border-slate-200">
        <button
          type="button"
          onClick={handlePrintSlip}
          className="py-2 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5"
        >
          <span>🖨️</span>
          <span>Print Shift Receipt</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setClosedSummary(null);
            fetchCurrentShift();
          }}
          className="py-2 px-5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition-colors"
        >
          ➕ Open Next Shift
        </button>
      </div>
    </div>
  );
}
