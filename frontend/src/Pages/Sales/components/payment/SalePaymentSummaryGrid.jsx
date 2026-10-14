import React from 'react';
import { taka, money } from '../../hooks/useNewSale';

/**
 * Two-column ultra-compact summary grid:
 * Left: Invoice Calculation (Net Amount, Less Discount, Payable)
 * Right: Balance Settlement (Previous Due, Total Payable, Current Due)
 */
export default function SalePaymentSummaryGrid({
  netAmount,
  loyaltyPointsToUse,
  discount,
  totalDiscount,
  payableAmount,
  previousDue,
  totalPayable,
  currentDue,
}) {
  return (
    <div className="grid grid-cols-2 gap-2 mb-1.5 bg-slate-50 p-1.5 sm:p-2 rounded-md border border-slate-200">
      {/* Left Column: Invoice Calculation */}
      <div className="flex flex-col gap-1">
        <div className="text-[0.66rem] font-extrabold text-slate-600 uppercase tracking-wide">
          Invoice Calculation
        </div>

        {/* Net Amount (Subtotal) */}
        <div className="flex justify-between items-center py-1 px-2 bg-white border border-slate-200 rounded min-h-[26px]">
          <label className="text-[0.68rem] font-bold text-slate-500">
            Net Amount
          </label>
          <span className="font-extrabold text-xs text-slate-800">
            {taka(netAmount)}
          </span>
        </div>

        {/* Less Discount */}
        <div className="flex justify-between items-center py-1 px-2 bg-white border border-slate-200 rounded min-h-[26px]">
          <div className="flex items-center gap-1">
            <label className="text-[0.68rem] font-bold text-rose-600 m-0">
              Less Disc.
            </label>
            {money(loyaltyPointsToUse) > 0 && (
              <span className="text-[0.60rem] text-slate-500">
                ({taka(loyaltyPointsToUse)})
              </span>
            )}
          </div>
          <div className="flex items-center justify-end gap-1">
            <span className="text-xs text-rose-600 font-bold">-৳</span>
            <span className="font-extrabold text-xs text-rose-600">
              {taka(totalDiscount !== undefined ? totalDiscount : money(discount) + money(loyaltyPointsToUse))}
            </span>
          </div>
        </div>

        {/* Payable Amount */}
        <div className="flex justify-between items-center py-1 px-2 bg-blue-50 border border-blue-200 rounded min-h-[26px]">
          <label className="text-[0.70rem] font-extrabold text-blue-800 uppercase">
            Payable
          </label>
          <span className="font-black text-xs text-blue-700">
            {taka(payableAmount)}
          </span>
        </div>
      </div>

      {/* Right Column: Balance Settlement */}
      <div className="flex flex-col gap-1">
        <div className="text-[0.66rem] font-extrabold text-slate-600 uppercase tracking-wide">
          Balance Settlement
        </div>

        {/* Previous Due */}
        <div className="flex justify-between items-center py-1 px-2 bg-amber-50 border border-amber-200 rounded min-h-[26px]">
          <label className="text-[0.68rem] font-bold text-amber-800">
            Prev. Due
          </label>
          <span
            className={`font-extrabold text-xs ${
              previousDue > 0 ? 'text-amber-700' : previousDue < 0 ? 'text-emerald-600' : 'text-slate-600'
            }`}
          >
            {previousDue < 0 ? `Adv: ${taka(Math.abs(previousDue))}` : taka(previousDue)}
          </span>
        </div>

        {/* Total Payable */}
        <div className="flex justify-between items-center py-1 px-2 bg-emerald-50 border border-emerald-200 rounded min-h-[26px]">
          <label className="text-[0.70rem] font-extrabold text-emerald-800 uppercase">
            Total Payable
          </label>
          <span className="font-black text-xs text-emerald-700">
            {taka(totalPayable)}
          </span>
        </div>

        {/* Current Due */}
        <div
          className={`flex justify-between items-center py-1 px-2 rounded min-h-[26px] border ${
            currentDue > 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'
          }`}
        >
          <label
            className={`text-[0.70rem] font-extrabold uppercase ${
              currentDue > 0 ? 'text-rose-800' : 'text-emerald-800'
            }`}
          >
            Current Due
          </label>
          <span className={`font-black text-xs ${currentDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {taka(currentDue)}
          </span>
        </div>
      </div>
    </div>
  );
}
