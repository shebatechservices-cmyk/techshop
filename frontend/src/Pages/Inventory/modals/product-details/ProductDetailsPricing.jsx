import React from 'react';

export default function ProductDetailsPricing({
  product,
  isTechnician,
  showCost,
  setShowCost,
  salePrice,
  costPrice,
  effectiveSale,
  effectiveCost,
  margin,
  marginPercent,
  totalValuation,
  mrp,
  convRate,
  formatMoney,
}) {
  return (
    <>
      {/* Pricing, Cost & Valuation Card */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4">
        <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
          <div className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
            <span>💰</span> {isTechnician ? 'Product Pricing' : 'Pricing & Financial Valuation'}
          </div>
          {!isTechnician && (
            <button
              type="button"
              onClick={() => setShowCost(!showCost)}
              className="text-xs text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 cursor-pointer"
            >
              <span>{showCost ? '🔒 Hide Cost' : '👁️ Reveal Cost'}</span>
            </button>
          )}
        </div>

        <div className={isTechnician ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "grid grid-cols-2 sm:grid-cols-4 gap-3"}>
          <div>
            <span className="text-[0.72rem] text-slate-500 block font-semibold">Selling Price</span>
            <span className="text-lg font-black text-emerald-700">
              {formatMoney(salePrice)}
              {convRate > 1 && <span className="text-xs font-normal text-slate-500"> /{product.unit_name || 'Box'}</span>}
            </span>
            {convRate > 1 && (
              <span className="text-[0.68rem] text-slate-500 block font-medium">
                {formatMoney(effectiveSale)} /{product.sub_unit_name || 'Unit'}
              </span>
            )}
          </div>

          {!isTechnician && (
            <>
              <div>
                <span className="text-[0.72rem] text-slate-500 block font-semibold">Purchase Cost</span>
                <span className="text-lg font-mono font-bold text-slate-700">
                  {showCost ? (
                    <>
                      {formatMoney(costPrice)}
                      {convRate > 1 && <span className="text-xs font-normal text-slate-500 font-sans"> /{product.unit_name || 'Box'}</span>}
                    </>
                  ) : '••••••'}
                </span>
                {showCost && convRate > 1 && (
                  <span className="text-[0.68rem] text-slate-500 block font-medium font-mono">
                    {formatMoney(effectiveCost)} /{product.sub_unit_name || 'Unit'}
                  </span>
                )}
              </div>

              <div>
                <span className="text-[0.72rem] text-slate-500 block font-semibold">Unit Margin</span>
                <span className="text-lg font-bold text-sky-700">
                  {showCost ? (
                    <>
                      {formatMoney(margin)}{' '}
                      <span className="text-xs font-normal text-slate-500">({marginPercent}%)</span>
                    </>
                  ) : (
                    '••••••'
                  )}
                </span>
              </div>

              <div>
                <span className="text-[0.72rem] text-slate-500 block font-semibold">In-Stock Valuation</span>
                <span className="text-lg font-bold text-indigo-700">
                  {showCost ? formatMoney(totalValuation) : '••••••'}
                </span>
              </div>
            </>
          )}
        </div>

        {mrp > 0 && (
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Maximum Retail Price (MRP): <strong>{formatMoney(mrp)}</strong></span>
            {!isTechnician && product.latest_purchase_date && (
              <span>Last Inflow Date: <strong>{new Date(product.latest_purchase_date).toLocaleDateString()}</strong></span>
            )}
          </div>
        )}
      </div>

      {/* Purchase Batches & Fixed Costs Breakdown */}
      {!isTechnician && Array.isArray(product.batches) && product.batches.length > 0 && (
        <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-4">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-sky-100 rounded text-sky-700 text-xs">📋</span>
              <span className="font-extrabold text-sm text-slate-900">
                Purchase Batches &amp; Fixed Costs ({product.batches.length})
              </span>
            </div>
            <span className="text-[11px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded border border-sky-200">
              Batch-Fixed Rates
            </span>
          </div>
          <div className="divide-y divide-sky-100 border border-sky-100 rounded-lg bg-white overflow-hidden text-xs">
            {product.batches.map((batch, bIdx) => {
              const bCost = Number(batch.cost_price || 0);
              const bFinal = Number(batch.final_cost || bCost);
              const bDate = batch.purchase_date
                ? new Date(batch.purchase_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                : 'N/A';
              return (
                <div key={batch.purchase_order_id || bIdx} className="p-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-sky-800">{batch.po_number || `PO #${batch.purchase_order_id}`}</span>
                      <span className="text-[10px] text-slate-400">• {bDate}</span>
                      <span className="text-[11px] font-medium text-slate-600 truncate max-w-[150px]">{batch.supplier_name}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Inflow: <strong className="text-slate-700">{batch.quantity} units</strong>
                    </div>
                  </div>
                  <div className="text-right ml-3 shrink-0 space-y-0.5">
                    <div className="font-mono text-xs">
                      <span className="text-[10px] text-slate-500 font-sans mr-1">Cost:</span>
                      <strong className="text-slate-900">{formatMoney(bCost)}</strong>
                      {bFinal > bCost && (
                        <span className="text-[10px] text-orange-600 font-semibold ml-1">
                          (Landed: {formatMoney(bFinal)})
                        </span>
                      )}
                    </div>
                    {batch.sale_price > 0 && (
                      <div className="font-mono text-xs">
                        <span className="text-[10px] text-slate-500 font-sans mr-1">Batch Sale:</span>
                        <strong className="text-emerald-700">{formatMoney(batch.sale_price)}</strong>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {product.batch_valuation > 0 && (
            <div className="mt-2.5 flex items-center justify-between text-xs pt-1.5 border-t border-sky-200/60 text-slate-600">
              <span>Actual Batch Stock Valuation:</span>
              <strong className="font-mono text-sky-800">{formatMoney(product.batch_valuation)}</strong>
            </div>
          )}
        </div>
      )}
    </>
  );
}
