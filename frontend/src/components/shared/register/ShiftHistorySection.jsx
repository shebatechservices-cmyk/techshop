import React from 'react';

export default function ShiftHistorySection({
  shiftHistory,
  selectedHistoryShift,
  setSelectedHistoryShift,
  fetchShiftHistory,
  handlePrintSlip,
}) {
  return (
    <div>
      {selectedHistoryShift ? (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <button
            type="button"
            onClick={() => setSelectedHistoryShift(null)}
            className="text-xs font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1 mb-3.5"
          >
            ← Back to Shift History List
          </button>

          <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Shift #{selectedHistoryShift.id} Audit Report
              </h3>
              <span className="text-xs text-slate-500">
                Opened: {new Date(selectedHistoryShift.opened_at).toLocaleString()} | Closed: {selectedHistoryShift.closed_at ? new Date(selectedHistoryShift.closed_at).toLocaleString() : 'Open'}
              </span>
            </div>

            <button
              type="button"
              onClick={handlePrintSlip}
              className="py-1.5 px-3.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 font-semibold text-xs text-slate-700 transition-colors"
            >
              🖨️ Print Slip
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 uppercase font-semibold">Opening Balance</span>
              <div className="text-base font-bold text-slate-800">৳{Number(selectedHistoryShift.opening_balance).toFixed(2)}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 uppercase font-semibold">Cash Sales</span>
              <div className="text-base font-bold text-sky-600">৳{Number(selectedHistoryShift.total_cash_sales).toFixed(2)}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 uppercase font-semibold">Due Collections</span>
              <div className="text-base font-bold text-emerald-600">৳{Number(selectedHistoryShift.total_due_collections).toFixed(2)}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 uppercase font-semibold">Cash Expenses</span>
              <div className="text-base font-bold text-rose-600">৳{Number(selectedHistoryShift.total_cash_expenses).toFixed(2)}</div>
            </div>
            <div className="bg-slate-100 p-3 rounded-xl border border-slate-300">
              <span className="text-[11px] text-slate-700 uppercase font-bold">Expected Drawer</span>
              <div className="text-base font-extrabold text-slate-900">৳{Number(selectedHistoryShift.expected_cash_balance).toFixed(2)}</div>
            </div>
            <div className="bg-slate-100 p-3 rounded-xl border border-slate-300">
              <span className="text-[11px] text-slate-700 uppercase font-bold">Actual Counted</span>
              <div className="text-base font-extrabold text-slate-900">৳{Number(selectedHistoryShift.actual_cash_counted).toFixed(2)}</div>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex justify-between items-center flex-wrap gap-2 text-xs">
            <div>
              <strong className="text-slate-800">Reconciliation Variance: </strong>
              <span
                className={`font-bold ${
                  Number(selectedHistoryShift.variance_amount) === 0
                    ? 'text-emerald-700'
                    : Number(selectedHistoryShift.variance_amount) > 0
                    ? 'text-sky-700'
                    : 'text-rose-700'
                }`}
              >
                ৳{Number(selectedHistoryShift.variance_amount).toFixed(2)} ({Number(selectedHistoryShift.variance_amount) === 0 ? 'Balanced' : Number(selectedHistoryShift.variance_amount) > 0 ? 'Overage' : 'Shortage'})
              </span>
            </div>
            <div className="text-slate-500">
              SMS Alert Sent: {selectedHistoryShift.sms_alert_sent ? '✅ Yes' : '❌ No'}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-3.5 sm:p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Past Register Shift Closings ({shiftHistory.length})
            </h4>
            <button
              type="button"
              onClick={fetchShiftHistory}
              className="text-xs text-sky-600 hover:text-sky-800 font-semibold"
            >
              🔄 Refresh
            </button>
          </div>

          {shiftHistory.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No shift records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="p-3">Shift #</th>
                    <th className="p-3">Opened</th>
                    <th className="p-3">Cashier</th>
                    <th className="p-3 text-right">Opening</th>
                    <th className="p-3 text-right">Sales</th>
                    <th className="p-3 text-right">Counted</th>
                    <th className="p-3 text-center">Variance</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {shiftHistory.map((s) => {
                    const variance = Number(s.variance_amount || 0);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-bold text-slate-900">#{s.id}</td>
                        <td className="p-3 text-slate-500">
                          {new Date(s.opened_at).toLocaleDateString()} {new Date(s.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-3">{s.closed_by_name || s.opened_by_name || 'Admin'}</td>
                        <td className="p-3 text-right">৳{Number(s.opening_balance).toFixed(2)}</td>
                        <td className="p-3 text-right text-sky-600 font-semibold">৳{Number(s.total_cash_sales).toFixed(2)}</td>
                        <td className="p-3 text-right font-bold">৳{Number(s.actual_cash_counted).toFixed(2)}</td>
                        <td className="p-3 text-center">
                          {variance === 0 ? (
                            <span className="text-emerald-600 font-semibold">৳0.00</span>
                          ) : variance > 0 ? (
                            <span className="text-sky-600 font-semibold">+৳{variance.toFixed(2)}</span>
                          ) : (
                            <span className="text-rose-600 font-semibold">৳{variance.toFixed(2)}</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {s.status === 'open' ? (
                            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[11px] font-bold">Open</span>
                          ) : s.status === 'closed' ? (
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-bold">Closed</span>
                          ) : (
                            <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[11px] font-bold">Discrepancy</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedHistoryShift(s)}
                            className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-700 shadow-sm transition-colors"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
