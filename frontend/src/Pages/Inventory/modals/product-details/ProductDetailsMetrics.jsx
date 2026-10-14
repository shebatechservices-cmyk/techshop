import React from 'react';

export default function ProductDetailsMetrics({
  product,
  stock,
  minStock,
  agingDays,
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
        <div className="text-[0.7rem] uppercase tracking-wider font-bold text-slate-500 mb-1">
          Available Stock
        </div>
        <div className="text-xl font-black text-slate-900">
          {stock} <span className="text-xs font-normal text-slate-500">pcs</span>
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">Min: {minStock} pcs</div>
      </div>

      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
        <div className="text-[0.7rem] uppercase tracking-wider font-bold text-slate-500 mb-1">
          Total Inflow
        </div>
        <div className="text-xl font-black text-sky-700">
          {product.total_inflow_units || product.purchase_count || 0}{' '}
          <span className="text-xs font-normal text-slate-500">pcs</span>
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">All Purchases</div>
      </div>

      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
        <div className="text-[0.7rem] uppercase tracking-wider font-bold text-slate-500 mb-1">
          Total Sold
        </div>
        <div className="text-xl font-black text-emerald-700">
          {product.total_sold_units || 0}{' '}
          <span className="text-xs font-normal text-slate-500">pcs</span>
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">POS & Invoices</div>
      </div>

      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
        <div className="text-[0.7rem] uppercase tracking-wider font-bold text-slate-500 mb-1">
          Inventory Aging
        </div>
        <div className={`text-xl font-black ${agingDays >= 60 ? 'text-red-600' : 'text-slate-900'}`}>
          {agingDays} <span className="text-xs font-normal text-slate-500">Days</span>
        </div>
        <div className="text-[10px] mt-0.5">
          {agingDays >= 60 ? (
            <span className="text-red-600 font-bold">⚠️ Aged Stock</span>
          ) : (
            <span className="text-emerald-600 font-medium">✓ Normal</span>
          )}
        </div>
      </div>
    </div>
  );
}
