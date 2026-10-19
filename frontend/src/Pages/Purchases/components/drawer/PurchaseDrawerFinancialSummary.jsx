import React from 'react';

export default function PurchaseDrawerFinancialSummary({ order, taka }) {
  const totalCost = Number(order?.total_cost || 0);
  const totalPaid = Number(order?.total_paid || 0);
  const totalDue = Number(order?.total_due || 0);
  const extraCost = Number(order?.extra_cost || 0);
  const discount = Number(order?.discount || 0);
  const goodsCost = Array.isArray(order?.items)
    ? order.items.reduce(
        (sum, it) => sum + Number(it.cost_price || 0) * Math.max(1, Number(it.quantity || 1)),
        0
      )
    : totalCost;

  return (
    <>
      {extraCost > 0 && (
        <div className="bg-orange-50/70 border border-orange-200 rounded-xl p-3.5 space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-orange-950 flex items-center gap-1">
              <span>🚚</span> Logistics &amp; Transport (Expense)
            </span>
            <span className="font-extrabold text-sm text-orange-800">
              +{taka(extraCost)}
            </span>
          </div>

          <div className="text-xs text-orange-900/80 flex items-center gap-2">
            <span className="bg-orange-200 text-orange-900 px-2 py-0.5 rounded text-[0.68rem] font-semibold">
              {order.extra_cost_category || 'Transportation & Logistics'}
            </span>
            {order.extra_cost_notes && (
              <span className="italic text-[0.72rem]">"{order.extra_cost_notes}"</span>
            )}
          </div>
        </div>
      )}

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
        <div className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider">
          Financial Summary
        </div>

        <div className="space-y-1.5 text-xs text-slate-600">
          <div className="flex justify-between items-center">
            <span>Goods Subtotal:</span>
            <span className="font-bold text-slate-800">{taka(goodsCost)}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between items-center text-rose-600">
              <span>Less Discount:</span>
              <span className="font-bold">- {taka(discount)}</span>
            </div>
          )}

          {extraCost > 0 && (
            <div className="flex justify-between items-center text-orange-800">
              <span>Landed Extra Cost:</span>
              <span className="font-bold">+{taka(extraCost)}</span>
            </div>
          )}

          <div className="pt-1.5 border-t border-slate-200 flex justify-between items-center font-extrabold text-sm text-slate-900">
            <span>Total Cost:</span>
            <span>{taka(totalCost)}</span>
          </div>

          <div className="flex justify-between items-center text-emerald-700">
            <span>Total Paid:</span>
            <span className="font-bold">{taka(totalPaid)}</span>
          </div>

          <div className="flex justify-between items-center pt-1 border-t border-dashed border-slate-200 font-extrabold">
            <span className={totalDue > 0 ? 'text-rose-600' : 'text-slate-700'}>
              Outstanding Due:
            </span>
            <span className={totalDue > 0 ? 'text-rose-600 text-sm' : 'text-emerald-600'}>
              {totalDue > 0 ? taka(totalDue) : 'No Due (Cleared)'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
