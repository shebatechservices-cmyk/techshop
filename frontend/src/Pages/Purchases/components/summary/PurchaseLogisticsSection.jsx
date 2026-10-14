import React, { useState } from 'react';
import { EXTRA_COST_CATEGORIES } from '../../hooks/usePurchaseCart';

const ChevronDown = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ChevronUp = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

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
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5 transition-all">
      <div className="flex items-center justify-between gap-2">
        <label
          className={`inline-flex items-center gap-2 cursor-pointer font-bold text-xs md:text-sm select-none ${
            hasExtraCost ? 'text-orange-800' : 'text-slate-700'
          }`}
        >
          <input
            type="checkbox"
            checked={hasExtraCost}
            onChange={(e) => {
              const isChecked = e.target.checked;
              setHasExtraCost(isChecked);
              if (isChecked) {
                setIsCollapsed(false);
                if (!extraCost || Number(extraCost) === 0) setExtraCost('');
              }
            }}
            className="w-4 h-4 cursor-pointer accent-orange-500 rounded"
          />
          <span>🚚 Logistics & Extra Cost (Recorded as Expense)</span>
        </label>

        {hasExtraCost && (
          <div className="flex items-center gap-2">
            {extraCost && Number(extraCost) > 0 && (
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-md font-bold border border-orange-200">
                +৳{Number(extraCost).toLocaleString()} {isCollapsed && extraCostCategory ? `(${extraCostCategory})` : ''}
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-xs text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded-md font-semibold flex items-center gap-1 transition-colors"
              title={isCollapsed ? 'Expand Details' : 'Collapse Details'}
            >
              <span>{isCollapsed ? 'Expand (খুলুন)' : 'Collapse (ছোট করুন)'}</span>
              {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          </div>
        )}
      </div>

      {hasExtraCost && !isCollapsed && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-200 grid grid-cols-1 md:grid-cols-[1.2fr_1.2fr_1.6fr] gap-2.5">
          {/* Extra Cost Amount */}
          <div>
            <label className="block text-[0.7rem] font-semibold text-slate-600 mb-0.5">
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
              className="w-full py-1.5 px-2 rounded-md border border-slate-300 text-sm box-border bg-white focus:outline-none focus:border-emerald-500 font-bold text-orange-700"
            />
          </div>

          {/* Extra Cost Category */}
          <div>
            <label className="block text-[0.7rem] font-semibold text-slate-600 mb-0.5">
              Expense Category
            </label>
            <select
              value={extraCostCategory}
              onChange={(e) => setExtraCostCategory(e.target.value)}
              className="w-full py-1.5 px-2 rounded-md border border-slate-300 text-sm bg-white box-border cursor-pointer focus:outline-none focus:border-emerald-500"
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
            <label className="block text-[0.7rem] font-semibold text-slate-600 mb-0.5">
              Transaction Reference / Note
            </label>
            <input
              type="text"
              value={extraCostNotes}
              onChange={(e) => setExtraCostNotes && setExtraCostNotes(e.target.value)}
              placeholder="e.g. Courier Challan #48291 / Memo"
              className="w-full py-1.5 px-2 rounded-md border border-slate-300 text-sm box-border bg-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
