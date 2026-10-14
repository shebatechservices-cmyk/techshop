import React from 'react';
import { taka } from '../../hooks/useNewSale';

/**
 * Cost & Margin preview popover for POS items.
 */
export default function SaleProductCostPeekCard({
  item,
  activeCostCardId,
  toggleCostCard,
  sellPrice,
  actualCost,
  margin,
  marginPct,
}) {
  const isOpen = activeCostCardId === item.localId;

  return (
    <div className={`cost-peek-container relative flex justify-center items-center gap-1.5 ${isOpen ? 'z-[1001]' : 'z-[1]'}`}>
      <button
        type="button"
        onClick={() => toggleCostCard(item.localId)}
        title={isOpen ? 'Hide Cost & Margin Info' : 'Show Cost & Margin Info'}
        className={`border-0 rounded w-6 h-6 cursor-pointer flex items-center justify-center transition-colors ${
          isOpen ? 'bg-indigo-100 text-indigo-600' : 'bg-transparent text-slate-400 hover:text-indigo-600'
        }`}
      >
        {isOpen ? (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5 opacity-60 hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] right-0 w-[235px] bg-white border border-slate-300 rounded-md shadow-2xl p-3 z-[999999] text-left font-sans">
          <div className="font-bold text-slate-800 text-xs pb-2 border-b border-slate-200 mb-2">
            Cost &amp; Margin Info
          </div>

          <div className="flex justify-between items-center mb-1.5 text-xs">
            <span className="text-slate-500">Sell Price:</span>
            <strong className="text-slate-900">{taka(sellPrice)}</strong>
          </div>

          <div className="flex justify-between items-center mb-2 text-xs">
            <span className="text-slate-500">Purchase Cost:</span>
            <strong className="text-slate-900">{taka(actualCost)}</strong>
          </div>

          <div className="border-b border-slate-200 mb-2" />

          <div className="flex justify-between items-center mb-1.5 text-xs">
            <strong className="text-slate-800">Margin:</strong>
            <strong className="text-emerald-600">{taka(margin)}</strong>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Margin %:</span>
            <strong className="text-emerald-600">{marginPct}%</strong>
          </div>

          {item.is_warranty_required && Number(item.warranty_months || 0) > 0 && (
            <>
              <div className="border-b border-slate-200 my-2" />
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Customer Warranty:</span>
                <strong className="text-emerald-600">{item.warranty_months} Months</strong>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
