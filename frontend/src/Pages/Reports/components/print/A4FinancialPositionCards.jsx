import React from 'react';

export default function A4FinancialPositionCards({ inventory, ledgers }) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {/* Inventory & Working Capital Valuation */}
      <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
        <h4 className="text-xs font-bold text-slate-900 uppercase border-b border-slate-200 pb-1.5 mb-2.5">
          📦 Current Inventory Asset Valuation
        </h4>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Active Stock SKUs:</span>
            <strong className="text-slate-800">
              {inventory.total_skus || 0} products ({inventory.total_stock_units || 0} total units)
            </strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Total Stock Cost Valuation:</span>
            <strong className="text-blue-600">
              ৳ {inventory.total_cost_value?.toLocaleString('en-IN') || 0}
            </strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Expected Retail Value:</span>
            <strong className="text-slate-900">
              ৳ {inventory.total_retail_value?.toLocaleString('en-IN') || 0}
            </strong>
          </div>
          <div className="flex justify-between border-t border-dashed border-slate-300 pt-1 text-emerald-800">
            <span className="font-semibold">Unrealized Store Profit:</span>
            <strong className="font-bold">
              ৳ {inventory.potential_profit?.toLocaleString('en-IN') || 0}
            </strong>
          </div>
        </div>
      </div>

      {/* Cash Flow & Ledger Balances */}
      <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
        <h4 className="text-xs font-bold text-slate-900 uppercase border-b border-slate-200 pb-1.5 mb-2.5">
          👥 Working Capital &amp; Party Balances
        </h4>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Customer Receivables (Market Due):</span>
            <strong className="text-red-600">
              ৳ {ledgers.total_customer_receivables?.toLocaleString('en-IN') || 0}
            </strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Supplier Payables (Vendor Due):</span>
            <strong className="text-amber-600">
              ৳ {ledgers.total_supplier_payables?.toLocaleString('en-IN') || 0}
            </strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Cash In Drawers (Physical):</span>
            <strong className="text-teal-700">
              ৳ {ledgers.total_cash_in_drawers?.toLocaleString('en-IN') || 0}
            </strong>
          </div>
          <div className="flex justify-between border-t border-dashed border-slate-300 pt-1 text-slate-900">
            <span className="font-bold">Total Liquid Funds (All Accounts):</span>
            <strong className="font-bold">
              ৳ {ledgers.total_liquid_funds?.toLocaleString('en-IN') || 0}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
