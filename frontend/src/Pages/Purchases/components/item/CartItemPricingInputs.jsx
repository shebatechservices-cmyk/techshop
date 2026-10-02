import React from 'react';

export default function CartItemPricingInputs({
  item,
  cost,
  qty,
  overheadRatio,
  finalUnitCost,
  finalSale,
  isSoldLocked,
  soldQuantity,
  isSerialTracked,
  barcodesList = [],
  updateItem,
  handleItemCostChange,
  handleItemMarginChange,
  taka,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-2.5 items-center">
      {/* Quantity */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
          Quantity *
        </label>
        <input
          type="number"
          min={isSoldLocked ? soldQuantity : 1}
          readOnly={isSerialTracked}
          value={isSerialTracked ? barcodesList.length : item.quantity}
          onChange={(e) => {
            if (isSerialTracked) return;
            const minVal = isSoldLocked ? soldQuantity : 1;
            updateItem(item.localId, {
              quantity: Math.max(minVal, Number(e.target.value || minVal)),
            });
          }}
          className={`w-full min-w-[90px] py-1 px-2 rounded-md text-xs text-center box-border ${
            isSerialTracked && barcodesList.length === 0
              ? 'border-2 border-rose-500'
              : 'border border-slate-300'
          } ${
            isSerialTracked
              ? 'bg-slate-50 text-slate-900 font-bold cursor-not-allowed'
              : 'bg-white text-slate-900 font-bold cursor-text'
          }`}
          title={
            isSerialTracked
              ? 'Quantity is automatically calculated from scanned serials and cannot be manually modified'
              : isSoldLocked
              ? `Quantity locked to minimum ${soldQuantity} sold unit(s)`
              : 'Enter quantity manually'
          }
        />
      </div>

      {/* Cost Price */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-sky-600 whitespace-nowrap">
          Cost Price ৳ *
        </label>
        <input
          type="number"
          step="any"
          value={item.cost_price}
          onChange={(e) => handleItemCostChange(item, e.target.value)}
          placeholder="0.00"
          className="w-full min-w-[90px] py-1 px-2 rounded-md border border-sky-400 text-xs box-border font-semibold focus:outline-none focus:border-sky-500"
        />
      </div>

      {/* Final Cost (Auto-adjusted Landed Cost) */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-indigo-700 whitespace-nowrap">
            Final Cost ৳
          </label>
          {overheadRatio > 0 && (
            <span
              className="text-[10px] font-black text-indigo-700 bg-indigo-100/90 px-1 py-0.5 rounded border border-indigo-200 leading-none"
              title={`+${(overheadRatio * 100).toFixed(2)}% logistics overhead added from total extra cost`}
            >
              +{(overheadRatio * 100).toFixed(2)}%
            </span>
          )}
        </div>
        <input
          type="text"
          readOnly
          value={finalUnitCost > 0 ? taka(finalUnitCost) : '৳ 0.00'}
          className="w-full min-w-[90px] py-1 px-2 rounded-md border border-indigo-300 bg-indigo-50/70 text-indigo-950 text-xs font-black text-center box-border cursor-default focus:outline-none"
          title={
            overheadRatio > 0
              ? `Final Landed Cost: Base ${taka(cost)} + ${taka(finalUnitCost - cost)} transport/logistics per unit`
              : 'Final unit cost is automatically calculated from Cost Price + pro-rata logistics/extra cost.'
          }
        />
      </div>

      {/* Sales Margin (%) */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
          Margin ({item.margin_type === 'percent' ? '%' : '৳'})
        </label>
        <div className="w-full min-w-0 flex gap-1 items-center">
          <input
            type="number"
            step="any"
            value={item.margin_value}
            onChange={(e) => handleItemMarginChange(item, e.target.value)}
            placeholder="15"
            className="w-full min-w-[90px] py-1 px-2 rounded-md border border-slate-300 text-xs text-center font-bold box-border focus:outline-none focus:border-emerald-500"
          />
          <div className="flex rounded-md overflow-hidden border border-slate-300 shrink-0">
            <button
              type="button"
              onClick={() => {
                updateItem(item.localId, { margin_type: 'percent' });
              }}
              className={`px-1.5 py-1 border-0 cursor-pointer text-[11px] font-bold ${
                item.margin_type === 'percent'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
              title="Percentage Margin (Default)"
            >
              %
            </button>
            <button
              type="button"
              onClick={() => {
                updateItem(item.localId, { margin_type: 'amount' });
              }}
              className={`px-1.5 py-1 border-0 cursor-pointer text-[11px] font-bold ${
                item.margin_type === 'amount'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
              title="Fixed Taka Margin"
            >
              ৳
            </button>
          </div>
        </div>
      </div>

      {/* Final Sale (Unit) */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-emerald-600 whitespace-nowrap">
          Final Sale ৳
        </label>
        <input
          type="text"
          readOnly
          value={finalSale > 0 ? taka(finalSale) : '৳ 0.00'}
          className="w-full min-w-[90px] py-1 px-2 rounded-md border border-emerald-300 bg-emerald-50 text-emerald-700 text-xs font-extrabold text-center box-border cursor-default"
          title="Final sale price is calculated from Landed Cost + Margin and cannot be manually modified."
        />
      </div>
    </div>
  );
}
