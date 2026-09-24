import React from 'react';

export default function InventoryValuationTab({ inventory = {} }) {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 4 Inventory Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs border-t-4 border-t-blue-600">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Stock SKUs
          </span>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {inventory.total_skus || 0} Products
          </div>
          <div className="text-xs text-slate-500 mt-1.5 font-medium">
            {inventory.total_stock_units || 0} Total Physical Units
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs border-t-4 border-t-slate-800">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Stock Acquisition Cost
          </span>
          <div className="text-2xl font-extrabold text-blue-700 mt-2">
            ৳ {inventory.total_cost_value?.toLocaleString('en-IN') || 0}
          </div>
          <div className="text-xs text-slate-500 mt-1.5 font-medium">
            Invested inventory capital
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs border-t-4 border-t-purple-600">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Expected Retail Worth
          </span>
          <div className="text-2xl font-extrabold text-purple-700 mt-2">
            ৳ {inventory.total_retail_value?.toLocaleString('en-IN') || 0}
          </div>
          <div className="text-xs text-slate-500 mt-1.5 font-medium">
            Selling value at standard prices
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs border-t-4 border-t-emerald-500">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Unrealized Profit Potential
          </span>
          <div className="text-2xl font-extrabold text-emerald-700 mt-2">
            ৳ {inventory.potential_profit?.toLocaleString('en-IN') || 0}
          </div>
          <div className="text-xs text-emerald-600 mt-1.5 font-semibold">
            Gross potential upon full sale
          </div>
        </div>
      </div>

      {/* Stock Health & Valuation Deep Dive */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span>📦</span> Inventory Liquidity & Valuation Overview
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-800 uppercase tracking-wide text-[11px]">
              Stock Valuation Summary
            </h4>
            <div className="flex justify-between border-b border-slate-200 pb-1.5">
              <span className="text-slate-500">Cost Valuation:</span>
              <strong className="text-blue-700 font-mono">
                ৳ {inventory.total_cost_value?.toLocaleString('en-IN') || 0}
              </strong>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1.5">
              <span className="text-slate-500">Retail Selling Valuation:</span>
              <strong className="text-purple-700 font-mono">
                ৳ {inventory.total_retail_value?.toLocaleString('en-IN') || 0}
              </strong>
            </div>
            <div className="flex justify-between pt-0.5">
              <span className="text-emerald-800 font-bold">Unrealized Store Margin:</span>
              <strong className="text-emerald-700 font-mono">
                ৳ {inventory.potential_profit?.toLocaleString('en-IN') || 0}
              </strong>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-800 uppercase tracking-wide text-[11px]">
              Unit Holding Metrics
            </h4>
            <div className="flex justify-between border-b border-slate-200 pb-1.5">
              <span className="text-slate-500">Active Unique SKUs:</span>
              <strong className="text-slate-800">{inventory.total_skus || 0} Products</strong>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1.5">
              <span className="text-slate-500">Total Quantities on Hand:</span>
              <strong className="text-slate-800">{inventory.total_stock_units || 0} Units</strong>
            </div>
            <div className="flex justify-between pt-0.5">
              <span className="text-slate-500">Average Unit Cost:</span>
              <strong className="text-slate-800 font-mono">
                ৳{' '}
                {inventory.total_stock_units > 0
                  ? Math.round((inventory.total_cost_value || 0) / inventory.total_stock_units).toLocaleString('en-IN')
                  : 0}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
