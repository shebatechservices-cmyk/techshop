import React from 'react';

export default function CartItemSummaryBadges({
  qty = 1,
  isSerialTracked = false,
  barcodesList = [],
  cost = 0,
  overheadRatio = 0,
  finalUnitCost = 0,
  lineTotal = 0,
  finalLineTotal = 0,
  item = {},
  finalSale = 0,
  taka,
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap py-1.5 px-2.5 bg-slate-50 rounded-lg border border-slate-200 mb-2.5 text-xs">
      <span className="bg-slate-200 text-slate-700 py-0.5 px-2 rounded-full font-semibold">
        📦 {qty} units / {isSerialTracked ? `${barcodesList.length} serials` : 'No Serial'}
      </span>
      <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 py-0.5 px-2 rounded-full font-bold">
        Unit Cost: {taka(cost)}
      </span>
      {overheadRatio > 0 && (
        <span
          className="bg-indigo-50 border border-indigo-200 text-indigo-800 py-0.5 px-2 rounded-full font-bold"
          title={`Landed / Final Cost: ${taka(finalUnitCost)} per unit (includes +${(overheadRatio * 100).toFixed(2)}% recurring logistics/extra cost)`}
        >
          Final Cost: {taka(finalUnitCost)}
          <span className="text-[10px] ml-1 text-indigo-600 font-black">
            (+{(overheadRatio * 100).toFixed(2)}%)
          </span>
        </span>
      )}
      <span className="bg-amber-50 border border-amber-200 text-amber-800 py-0.5 px-2 rounded-full font-bold">
        Sale Margin: {item.margin_value || 15}
        {item.margin_type === 'percent' ? '%' : '৳'}
      </span>
      <span className="bg-sky-50 border border-sky-200 text-sky-700 py-0.5 px-2 rounded-full font-bold">
        Total Cost: {taka(overheadRatio > 0 ? finalLineTotal : lineTotal)}
      </span>
      <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 py-0.5 px-2 rounded-full font-bold">
        Total Sale: {taka(Number((finalSale * qty).toFixed(2)))}
      </span>
    </div>
  );
}
