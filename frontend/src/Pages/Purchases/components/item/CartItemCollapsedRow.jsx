import React from 'react';

export default function CartItemCollapsedRow({
  item,
  displayName,
  qty,
  isSerialTracked,
  barcodesList = [],
  cost,
  overheadRatio,
  finalUnitCost,
  finalLineTotal,
  lineTotal,
  finalSale,
  isSoldLocked,
  soldQuantity,
  setExpandedId,
  handleRemoveItem,
  taka,
}) {
  return (
    <div className="border border-slate-200 rounded-xl bg-white py-1.5 px-3 flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-2 flex-1 min-w-[320px]">
        <span className="text-emerald-500 text-lg">⬡</span>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="font-extrabold text-sm text-slate-900">
              {displayName}
            </span>
            <span className="bg-slate-200 text-slate-700 py-0.5 px-1.5 rounded font-semibold">
              📦 {qty} units / {isSerialTracked ? `${barcodesList.length} serials` : 'No Serial'}
            </span>
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 py-0.5 px-1.5 rounded font-bold">
              Unit Cost: {taka(cost)}
            </span>
            {overheadRatio > 0 && (
              <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 py-0.5 px-1.5 rounded font-bold" title="Landed / Final Cost including logistics">
                Final Cost: {taka(finalUnitCost)}
              </span>
            )}
            <span className="bg-amber-50 text-amber-800 border border-amber-200 py-0.5 px-1.5 rounded font-bold">
              Sale Margin: {item.margin_value || 15}
              {item.margin_type === 'percent' ? '%' : '৳'}
            </span>
            <span className="bg-sky-50 text-sky-700 border border-sky-200 py-0.5 px-1.5 rounded font-bold">
              Total Cost: {taka(overheadRatio > 0 ? finalLineTotal : lineTotal)}
            </span>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 py-0.5 px-1.5 rounded font-bold">
              Total Sale: {taka(Number((finalSale * qty).toFixed(2)))}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setExpandedId(item.localId)}
          className="py-1 px-2.5 rounded-md border border-slate-300 bg-slate-50 text-slate-900 font-semibold text-xs cursor-pointer hover:bg-slate-100 transition-colors"
        >
          ✏️ Edit
        </button>
        <button
          type="button"
          disabled={isSoldLocked}
          onClick={() => {
            if (!isSoldLocked) handleRemoveItem(item.localId);
          }}
          className={`border-0 text-base p-0.5 transition-colors ${
            isSoldLocked
              ? 'bg-transparent text-slate-300 cursor-not-allowed'
              : 'bg-transparent text-rose-500 hover:text-rose-700 cursor-pointer'
          }`}
          title={
            isSoldLocked
              ? `Cannot remove: ${soldQuantity} unit(s) already sold`
              : 'Remove product'
          }
        >
          {isSoldLocked ? '🔒' : '✕'}
        </button>
      </div>
    </div>
  );
}
