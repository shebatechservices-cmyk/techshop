import React from 'react';

export default function InventoryPriceCell({
  product: p,
  taka,
  isTechnician,
  revealedCostIds,
  toggleCostVisibility
}) {
  return (
    <td className="py-1 px-2.5 text-right align-middle">
      <div className="flex flex-col items-end gap-px">
        <span className="font-extrabold text-slate-900 text-xs" title="Retail Selling Price">
          {taka(p.sale_price)}
          {p.conversion_rate > 1 && p.unit_name && (
            <span className="text-[0.65rem] font-normal text-slate-500"> /{p.unit_name}</span>
          )}
        </span>
        {p.conversion_rate > 1 && p.sub_unit_name && (
          <span className="text-[0.62rem] text-slate-500 font-medium leading-none">
            {taka(p.effective_sale_per_unit)}/{p.sub_unit_name}
          </span>
        )}
        {!isTechnician && (
          <div className="inline-flex items-center gap-1 text-[0.66rem] text-slate-500">
            <span>Cost:</span>
            <span className="font-bold text-slate-600 font-mono">
              {revealedCostIds?.has(p.id) ? (
                <>
                  {taka(p.cost_price)}
                  {p.conversion_rate > 1 && p.sub_unit_name && (
                    <span className="font-sans font-normal text-[0.62rem] text-slate-500"> ({taka(p.effective_cost_per_unit)}/{p.sub_unit_name})</span>
                  )}
                </>
              ) : '৳••••'}
            </span>
            <button
              type="button"
              onClick={() => toggleCostVisibility(p.id)}
              className={`bg-transparent border-0 cursor-pointer px-0.5 inline-flex items-center leading-none ${
                revealedCostIds?.has(p.id) ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'
              }`}
              title={revealedCostIds?.has(p.id) ? 'Hide unit cost' : 'Show unit cost'}
              aria-label={revealedCostIds?.has(p.id) ? 'Hide cost' : 'Show cost'}
            >
              {revealedCostIds?.has(p.id) ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
    </td>
  );
}
