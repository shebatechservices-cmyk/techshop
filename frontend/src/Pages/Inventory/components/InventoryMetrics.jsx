import React from 'react';

export default function InventoryMetrics({
  summary,
  showCostValuation,
  setShowCostValuation,
  stockFilter,
  setStockFilter,
  setCurrentPage,
  activeWarrantyCount,
  taka,
}) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2 mb-3">
      {/* Total SKUs */}
      <div
        className="bg-white py-2 px-3 rounded-lg border border-slate-200 shadow-sm"
        title="Total unique registered products in catalog"
      >
        <div className="flex justify-between items-center">
          <span className="text-[0.68rem] font-bold text-slate-500 uppercase tracking-wider">Total SKUs</span>
          <span className="text-sm">📦</span>
        </div>
        <div className="text-lg font-extrabold text-slate-900 mt-0.5 leading-tight">
          {summary.total_products.toLocaleString()}
        </div>
      </div>

      {/* Total Stock Units */}
      <div
        className="bg-white py-2 px-3 rounded-lg border border-slate-200 shadow-sm"
        title="Total physical inventory units across all warehouse locations"
      >
        <div className="flex justify-between items-center">
          <span className="text-[0.68rem] font-bold text-sky-600 uppercase tracking-wider">In-Stock Units</span>
          <span className="text-sm">📊</span>
        </div>
        <div className="text-lg font-extrabold text-sky-600 mt-0.5 leading-tight">
          {summary.total_units.toLocaleString()} <span className="text-xs font-semibold text-sky-600/80">pcs</span>
        </div>
      </div>

      {/* Stock Valuation (Cost Basis) */}
      <div
        className="bg-white py-2 px-3 rounded-lg border border-slate-200 shadow-sm"
        title="Total stock capital valuation based on unit cost"
      >
        <div className="flex justify-between items-center">
          <span className="text-[0.68rem] font-bold text-slate-600 uppercase tracking-wider">Cost Valuation</span>
          <button
            type="button"
            onClick={() => setShowCostValuation(!showCostValuation)}
            className="bg-transparent border-0 cursor-pointer text-slate-400 hover:text-slate-600 p-0 leading-none inline-flex items-center"
            title={showCostValuation ? 'Hide Cost Valuation' : 'Show Cost Valuation'}
          >
            {showCostValuation ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
              </svg>
            )}
          </button>
        </div>
        <div className="text-lg font-extrabold text-slate-700 mt-0.5 leading-tight">
          {showCostValuation ? taka(summary.total_cost_valuation) : '৳ ••••••'}
        </div>
      </div>

      {/* Retail Valuation */}
      <div
        className="bg-white py-2 px-3 rounded-lg border border-slate-200 shadow-sm"
        title="Estimated total retail sales value"
      >
        <div className="flex justify-between items-center">
          <span className="text-[0.68rem] font-bold text-green-600 uppercase tracking-wider">Retail Value</span>
          <span className="text-sm">📈</span>
        </div>
        <div className="text-lg font-extrabold text-green-600 mt-0.5 leading-tight">
          {taka(summary.total_retail_valuation)}
        </div>
      </div>

      {/* Low Stock Warning (Interactive Click to Filter) */}
      <div
        onClick={() => {
          setStockFilter(stockFilter === 'low_stock' ? 'all' : 'low_stock');
          setCurrentPage(1);
        }}
        className={`py-2 px-3 rounded-lg cursor-pointer transition-all shadow-sm ${
          stockFilter === 'low_stock'
            ? 'bg-orange-50 border-[1.5px] border-orange-600'
            : 'bg-white border border-orange-200 hover:border-orange-300'
        }`}
        title="Click to filter products with low stock (Reorder needed)"
      >
        <div className="flex justify-between items-center">
          <span className="text-[0.68rem] font-bold text-orange-700 uppercase tracking-wider">
            Low Stock {stockFilter === 'low_stock' && '✓'}
          </span>
          <span className="text-sm">⚠️</span>
        </div>
        <div className="text-lg font-extrabold text-orange-600 mt-0.5 leading-tight">
          {summary.low_stock_count} <span className="text-xs font-semibold text-orange-700/80">items</span>
        </div>
      </div>

      {/* Out of Stock Warning (Interactive Click to Filter) */}
      <div
        onClick={() => {
          setStockFilter(stockFilter === 'out_of_stock' ? 'all' : 'out_of_stock');
          setCurrentPage(1);
        }}
        className={`py-2 px-3 rounded-lg cursor-pointer transition-all shadow-sm ${
          stockFilter === 'out_of_stock'
            ? 'bg-red-50 border-[1.5px] border-red-600'
            : 'bg-white border border-red-200 hover:border-red-300'
        }`}
        title="Click to filter out of stock products"
      >
        <div className="flex justify-between items-center">
          <span className="text-[0.68rem] font-bold text-red-700 uppercase tracking-wider">
            Out of Stock {stockFilter === 'out_of_stock' && '✓'}
          </span>
          <span className="text-sm">🚫</span>
        </div>
        <div className="text-lg font-extrabold text-red-600 mt-0.5 leading-tight">
          {summary.out_of_stock_count} <span className="text-xs font-semibold text-red-700/80">items</span>
        </div>
      </div>

      {/* Supplier 60-Day Warranty Tracking Status */}
      <div
        className="bg-white py-2 px-3 rounded-lg border border-slate-200 shadow-sm"
        title="Active supplier warranty tracking with 60-day validity"
      >
        <div className="flex justify-between items-center">
          <span className="text-[0.68rem] font-bold text-sky-700 uppercase tracking-wider">Warranty</span>
          <span className="text-sm">🛡️</span>
        </div>
        <div className="text-lg font-extrabold text-sky-600 mt-0.5 leading-tight">
          {activeWarrantyCount} <span className="text-xs font-semibold text-sky-700/80">active</span>
        </div>
      </div>
    </div>
  );
}
