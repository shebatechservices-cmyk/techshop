import React from 'react';
import { taka } from '../../hooks/usePurchaseCart';

export default function PurchaseCalculationGrid({
  itemsSubtotal = 0,
  totals = { units: 0, cost: 0, sale: 0 },
  netAmount = 0,
  discount = 0,
  setDiscount,
  payableAmount = 0,
  extra = 0,
  totalLandedCost = 0,
  previousDue = 0,
  totalPayable = 0,
  currentDue = 0,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
      {/* Left Column: Purchase Order Calculation */}
      <div className="flex flex-col gap-2">
        <div className="text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-0.5">
          Purchase Order Calculation
        </div>

        {/* Goods Subtotal */}
        <div className="flex justify-between items-center py-2 px-3 bg-white border border-slate-200 rounded-md">
          <div>
            <label className="block text-xs font-bold text-slate-600">
              Goods Subtotal (পণ্যের মূল্য)
            </label>
            <div className="text-[0.66rem] text-slate-400">
              Total item purchase cost from supplier
            </div>
          </div>
          <span className="font-extrabold text-sm text-slate-800">
            {taka(itemsSubtotal || totals.cost || netAmount)}
          </span>
        </div>

        {/* Less Discount */}
        <div className="flex justify-between items-center py-1.5 px-3 bg-white border border-slate-200 rounded-md gap-2">
          <label className="text-xs font-bold text-rose-600 whitespace-nowrap">
            Less Discount (ডিসকাউন্ট)
          </label>
          <div className="flex items-center gap-1 max-w-[140px]">
            <span className="text-sm text-rose-600 font-bold">-৳</span>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              value={discount === '' ? '' : discount}
              onChange={(e) => {
                const val = e.target.value;
                setDiscount(val === '' ? '' : Math.max(0, parseFloat(val) || 0));
              }}
              className="w-full py-1 px-2 rounded border border-slate-300 text-sm font-bold text-rose-600 text-right outline-none focus:border-rose-400"
            />
          </div>
        </div>

        {/* Supplier Payable (Goods Subtotal - Discount) */}
        <div className="flex justify-between items-center py-2 px-3 bg-blue-50 border border-blue-200 rounded-md">
          <div>
            <label className="text-xs font-extrabold text-blue-900 uppercase">
              Supplier Payable (প্রদেয় বিল)
            </label>
            <div className="text-[0.66rem] text-blue-700">
              Amount owed to supplier for goods
            </div>
          </div>
          <span className="font-black text-base text-blue-700">
            {taka(payableAmount)}
          </span>
        </div>

        {/* If Extra Cost exists: Display Logistics Expense and Total Landed Cost */}
        {extra > 0 && (
          <div className="mt-1 pt-2 border-t border-dashed border-slate-300 flex flex-col gap-1.5">
            <div className="flex justify-between items-center py-1.5 px-2.5 bg-orange-50 border border-orange-200 rounded-md text-xs">
              <div className="flex items-center gap-1.5 text-orange-900 font-bold">
                <span>🚚 Logistics & Transport (Expense)</span>
                <span className="text-[0.65rem] bg-orange-200 text-orange-800 px-1.5 py-0.5 rounded font-semibold">
                  Logged in Expenses
                </span>
              </div>
              <span className="font-bold text-orange-800">
                +{taka(extra)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 px-2.5 bg-slate-100 border border-slate-300 rounded-md text-xs">
              <div>
                <div className="font-extrabold text-slate-700 uppercase tracking-wide">
                  Total Landed Cost (ইনভেন্টরি খরচ)
                </div>
                <div className="text-[0.66rem] text-slate-500">
                  Pro-rata distributed to Product Final Cost
                </div>
              </div>
              <span className="font-black text-sm text-slate-800">
                {taka(totalLandedCost || (payableAmount + extra))}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Supplier Balance Settlement */}
      <div className="flex flex-col gap-2">
        <div className="text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-0.5">
          Supplier Balance Settlement
        </div>

        {/* Previous Due */}
        <div className="flex justify-between items-center py-2 px-3 bg-amber-50 border border-amber-200 rounded-md">
          <label className="text-xs font-bold text-amber-800">
            Previous Due
          </label>
          <span
            className={`font-extrabold text-sm ${
              previousDue > 0
                ? 'text-amber-700'
                : previousDue < 0
                ? 'text-emerald-600'
                : 'text-slate-600'
            }`}
          >
            {previousDue < 0
              ? `Advance: ${taka(Math.abs(previousDue))}`
              : taka(previousDue)}
          </span>
        </div>

        {/* Total Payable (Payable Amount + Previous Due) */}
        <div className="flex justify-between items-center py-2 px-3 bg-emerald-50 border border-emerald-200 rounded-md">
          <label className="text-xs font-extrabold text-emerald-900 uppercase">
            Total Payable
          </label>
          <span className="font-black text-base text-emerald-700">
            {taka(totalPayable)}
          </span>
        </div>

        {/* Current Due (Total Payable - Sum of all accepted payment amounts) */}
        <div
          className={`flex justify-between items-center py-2 px-3 rounded-md border ${
            currentDue > 0
              ? 'bg-rose-50 border-rose-200'
              : 'bg-emerald-50 border-emerald-200'
          }`}
        >
          <label
            className={`text-xs font-extrabold uppercase ${
              currentDue > 0 ? 'text-rose-800' : 'text-emerald-800'
            }`}
          >
            Current Due
          </label>
          <span
            className={`font-black text-base ${
              currentDue > 0 ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {taka(currentDue)}
          </span>
        </div>
      </div>
    </div>
  );
}
