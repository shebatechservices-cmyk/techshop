import React from 'react';
import { EXTRA_COST_CATEGORIES } from '../../hooks/usePurchaseCart';

export default function PurchaseLogisticsSection({
  hasExtraCost,
  setHasExtraCost,
  extraCost,
  setExtraCost,
  extraCostCategory,
  setExtraCostCategory,
  extraCostNotes = '',
  setExtraCostNotes,
}) {
  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 flex flex-col gap-2.5">
      <label
        className={`inline-flex items-center gap-2 cursor-pointer font-bold text-sm ${
          hasExtraCost ? 'text-orange-800' : 'text-slate-800'
        }`}
      >
        <input
          type="checkbox"
          checked={hasExtraCost}
          onChange={(e) => {
            const isChecked = e.target.checked;
            setHasExtraCost(isChecked);
            if (isChecked && (!extraCost || Number(extraCost) === 0)) {
              setExtraCost('');
            }
          }}
          className="w-4 h-4 cursor-pointer accent-orange-500"
        />
        <span>🚚 Logistics & Extra Cost (Recorded as Expense)</span>
      </label>

      {hasExtraCost && (
        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1.2fr_1.6fr] gap-3">
          {/* Extra Cost Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Extra Cost ৳
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={extraCost}
              onChange={(e) => setExtraCost(e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder="0.00"
              className="w-full py-2 px-2.5 rounded-md border border-slate-300 text-sm box-border bg-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Extra Cost Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Expense Category
            </label>
            <select
              value={extraCostCategory}
              onChange={(e) => setExtraCostCategory(e.target.value)}
              className="w-full py-2 px-2.5 rounded-md border border-slate-300 text-sm bg-white box-border cursor-pointer focus:outline-none focus:border-emerald-500"
            >
              {EXTRA_COST_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Transaction Reference / Memo */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Transaction Reference / Note
            </label>
            <input
              type="text"
              value={extraCostNotes}
              onChange={(e) => setExtraCostNotes && setExtraCostNotes(e.target.value)}
              placeholder="e.g. Courier Challan #48291 / Memo"
              className="w-full py-2 px-2.5 rounded-md border border-slate-300 text-sm box-border bg-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
