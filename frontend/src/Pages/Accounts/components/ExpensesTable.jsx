import React from 'react';

export default function ExpensesTable({
  filteredExpenses = [],
  totalFilteredAmount = 0,
  setVoucherToPrint = () => {},
  setEditingExpense = () => {},
  handleDeleteExpense = () => {}
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-slate-900 text-white text-[0.74rem] font-extrabold tracking-wider uppercase">
              <th className="py-3 px-3.5">DATE & VOUCHER #</th>
              <th className="py-3 px-3.5">EXPENSE CATEGORY</th>
              <th className="py-3 px-3.5">PAID TO (PAYEE) & NOTE</th>
              <th className="py-3 px-3.5">PAYMENT SOURCE (ACCOUNT)</th>
              <th className="py-3 px-3.5">REF / MEMO</th>
              <th className="py-3 px-3.5 text-right">AMOUNT (৳)</th>
              <th className="py-3 px-3.5 text-center w-[130px]">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-9 px-3.5 text-center text-slate-400">
                  No expense records found for this filter.
                </td>
              </tr>
            ) : (
              filteredExpenses.map((ex, idx) => (
                <tr
                  key={ex.id || idx}
                  className={`border-b border-slate-100 hover:bg-slate-50/60 transition-colors ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                  }`}
                >
                  {/* Date & Voucher */}
                  <td className="py-3 px-3.5">
                    <strong className="font-mono text-sky-600">
                      {ex.voucher_no || `EXP-${ex.id}`}
                    </strong>
                    <div className="text-[0.74rem] text-slate-500 mt-0.5">
                      {new Date(ex.expense_date).toLocaleDateString()}
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-3.5">
                    <span className="inline-block py-0.5 px-2 rounded-md text-xs font-bold bg-slate-100 text-slate-800">
                      {ex.category_name}
                    </span>
                  </td>

                  {/* Payee & Note */}
                  <td className="py-3 px-3.5">
                    <div className="font-bold text-slate-900">{ex.payee_name || 'General'}</div>
                    <div
                      className="text-xs text-slate-500 mt-0.5 max-w-[280px] truncate"
                      title={ex.note || 'No additional note'}
                    >
                      {ex.note || 'No additional note'}
                    </div>
                  </td>

                  {/* Payment Source */}
                  <td className="py-3 px-3.5">
                    <span
                      className={`py-0.5 px-2 rounded text-xs font-semibold ${
                        String(ex.account_name).toLowerCase().includes('cash') ||
                        String(ex.account_name).toLowerCase().includes('drawer')
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {String(ex.account_name).toLowerCase().includes('cash') ? '💵' : '💳'}{' '}
                      {ex.account_name || 'Cash in Hand'}
                    </span>
                  </td>

                  {/* Reference Memo */}
                  <td className="py-3 px-3.5 font-mono text-xs text-slate-500">
                    {ex.reference_no || '-'}
                  </td>

                  {/* Amount */}
                  <td className="py-3 px-3.5 text-right font-extrabold text-red-600 text-sm font-mono">
                    ৳ {Number(ex.amount || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3.5 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setVoucherToPrint(ex)}
                      className="py-1 px-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold cursor-pointer mr-1 transition-colors"
                      title="Print Official Debit Payment Voucher"
                    >
                      🖨️ Voucher
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingExpense({ ...ex })}
                      className="py-1 px-2 rounded border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold cursor-pointer mr-1 transition-colors"
                      title="Edit Expense"
                    >
                      ✏️ Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteExpense(ex.id, ex.voucher_no, ex.amount)}
                      className="py-1 px-2 rounded border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold cursor-pointer transition-colors"
                      title="Delete & Refund to Account"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {filteredExpenses.length > 0 && (
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-300 font-extrabold">
                <td colSpan={5} className="py-3 px-3.5 text-right text-slate-600 text-xs">
                  FILTERED EXPENSES TOTAL:
                </td>
                <td className="py-3 px-3.5 text-right text-red-600 text-sm font-mono">
                  ৳ {totalFilteredAmount.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                </td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
