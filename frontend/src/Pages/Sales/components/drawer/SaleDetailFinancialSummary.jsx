import React from 'react';

export default function SaleDetailFinancialSummary({
  sale,
  taka,
  subtotal,
  discount,
  grandTotal,
  paid,
  due,
  isRefund,
  onCollectDue,
}) {
  const hasAdditionalInfo = sale.payment_method || sale.notes || sale.reference_no;

  return (
    <>
      {/* Financial Breakdown Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
        <div className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider">
          Financial Summary
        </div>

        <div className="space-y-1.5 text-xs text-slate-600">
          <div className="flex justify-between items-center">
            <span>Subtotal:</span>
            <span className="font-bold text-slate-800">{taka(subtotal)}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between items-center text-rose-600">
              <span>Discount:</span>
              <span className="font-bold">- {taka(discount)}</span>
            </div>
          )}

          <div className="pt-1.5 border-t border-slate-200 flex justify-between items-center font-extrabold text-sm text-slate-900">
            <span>Grand Total:</span>
            <span>{taka(grandTotal)}</span>
          </div>

          {isRefund ? (
            <div className="flex justify-between items-center text-purple-700 font-semibold">
              <span>Refund Paid Out:</span>
              <span className="font-bold">- {taka(paid)}</span>
            </div>
          ) : (
            <div className="flex justify-between items-center text-emerald-700">
              <span>Paid Amount:</span>
              <span className="font-bold">{taka(paid)}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-1 border-t border-dashed border-slate-200 font-extrabold">
            <span className={due > 0 ? 'text-rose-600' : 'text-slate-700'}>
              Remaining Due:
            </span>
            <span className={due > 0 ? 'text-rose-600 text-sm' : 'text-emerald-600'}>
              {due > 0 ? taka(due) : 'No Due (Cleared)'}
            </span>
          </div>

          {onCollectDue && due > 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onCollectDue(sale)}
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-colors cursor-pointer"
              >
                <span>💳</span> Settle / Collect Due ({taka(due)})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Payment Methods & Notes */}
      {hasAdditionalInfo && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-xs">
          <div className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider">
            Additional Information
          </div>
          {sale.payment_method && (
            <div className="flex justify-between text-slate-700">
              <span className="text-slate-500">Payment Method:</span>
              <span className="font-bold">{sale.payment_method}</span>
            </div>
          )}
          {sale.reference_no && (
            <div className="flex justify-between text-slate-700">
              <span className="text-slate-500">Reference:</span>
              <span className="font-mono">{sale.reference_no}</span>
            </div>
          )}
          {sale.notes && (
            <div className="pt-1 text-slate-600">
              <span className="text-slate-500 block mb-0.5">Notes:</span>
              <p className="bg-white p-2 rounded border border-slate-200 italic">{sale.notes}</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
