import React from 'react';

export default function A4ExecutivePrint({
  shop = {},
  pnl = {},
  inventory = {},
  ledgers = {},
  topProducts = [],
  printDateStr = '',
  periodLabel = '',
  filterDates = { from: '', to: '' },
}) {
  const isNetProfitPositive = (pnl.net_profit || 0) >= 0;

  return (
    <div className="text-slate-900 text-sm leading-normal">
      {/* Official Letterhead */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">
            {shop.shop_name || 'Seba Technology & Networking'}
          </h1>
          <p className="text-xs text-slate-600 font-medium mb-1">
            {shop.shop_title || 'Professional CCTV & Network Solution'}
          </p>
          <p className="text-xs text-slate-500">
            📍 {shop.address || 'Aruail South Market, Sarail'} &nbsp;|&nbsp; 📞 {shop.phone || '01800000000'}
          </p>
        </div>
        <div className="text-right">
          <div className="inline-block bg-slate-100 border border-slate-300 px-2.5 py-1 rounded text-[11px] font-bold text-slate-800 uppercase tracking-wider">
            Official Financial Statement
          </div>
          <div className="mt-1.5 text-xs text-slate-500">
            Generated: <strong className="text-slate-700">{printDateStr}</strong>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Period: <strong className="text-slate-900">{periodLabel}</strong> ({filterDates.from} to {filterDates.to})
          </div>
        </div>
      </div>

      {/* Statement Title */}
      <div className="text-center mb-5">
        <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-wide mb-1">
          Statement of Comprehensive Income (Profit & Loss)
        </h2>
        <span className="text-xs text-slate-500">
          Reporting Currency: Bangladeshi Taka (BDT ৳)
        </span>
      </div>

      {/* Performance Summary Badges */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">
            Gross Revenue
          </span>
          <div className="text-lg font-extrabold text-slate-800 mt-0.5">
            ৳ {pnl.gross_revenue?.toLocaleString('en-IN') || 0}
          </div>
          <small className="text-[11px] text-slate-500">{pnl.total_invoices || 0} Invoices Billed</small>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">
            Cost of Goods (COGS)
          </span>
          <div className="text-lg font-extrabold text-red-700 mt-0.5">
            ৳ {pnl.cogs?.toLocaleString('en-IN') || 0}
          </div>
          <small className="text-[11px] text-slate-500">Direct Product Cost</small>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <span className="text-[11px] text-emerald-800 uppercase font-bold tracking-wider">
            Gross Profit
          </span>
          <div className="text-lg font-extrabold text-emerald-700 mt-0.5">
            ৳ {pnl.gross_profit?.toLocaleString('en-IN') || 0}
          </div>
          <small className="text-[11px] text-emerald-800 font-semibold">
            Margin: {pnl.gross_margin_pct || 0}%
          </small>
        </div>

        <div
          className={`border rounded-lg p-3 ${
            isNetProfitPositive
              ? 'bg-blue-50 border-blue-200 text-blue-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <span className="text-[11px] uppercase font-bold tracking-wider opacity-80">
            Net Bottom-Line
          </span>
          <div
            className={`text-lg font-extrabold mt-0.5 ${
              isNetProfitPositive ? 'text-blue-700' : 'text-red-700'
            }`}
          >
            ৳ {pnl.net_profit?.toLocaleString('en-IN') || 0}
          </div>
          <small className="text-[11px] font-semibold opacity-90">
            Net Margin: {pnl.net_margin_pct || 0}%
          </small>
        </div>
      </div>

      {/* Formal P&L Accounting Ledger Table */}
      <table className="w-full border-collapse mb-6 text-xs">
        <thead>
          <tr className="bg-slate-900 text-white">
            <th className="py-2 px-3 text-left font-bold rounded-tl">Financial Particulars & Ledger Items</th>
            <th className="py-2 px-3 text-right font-bold w-36">Subtotal (৳)</th>
            <th className="py-2 px-3 text-right font-bold w-40 rounded-tr">Amount (৳)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          <tr>
            <td className="py-2 px-3 font-semibold text-slate-900">Gross Product Sales Revenue</td>
            <td className="py-2 px-3 text-right text-slate-500"></td>
            <td className="py-2 px-3 text-right font-bold text-slate-900">
              ৳ {pnl.gross_revenue?.toLocaleString('en-IN') || 0}
            </td>
          </tr>
          <tr className="text-slate-500">
            <td className="py-1.5 px-3 pl-7">Less: Trade Discounts & Rebates Given</td>
            <td className="py-1.5 px-3 text-right text-red-600 font-medium">
              - ৳ {pnl.total_discounts?.toLocaleString('en-IN') || 0}
            </td>
            <td className="py-1.5 px-3 text-right"></td>
          </tr>
          <tr className="text-slate-500">
            <td className="py-1.5 px-3 pl-7">Add: Value Added Tax (VAT / Tax Collected)</td>
            <td className="py-1.5 px-3 text-right text-emerald-700 font-medium">
              + ৳ {pnl.total_tax?.toLocaleString('en-IN') || 0}
            </td>
            <td className="py-1.5 px-3 text-right"></td>
          </tr>
          <tr className="bg-slate-50 border-b border-slate-300">
            <td className="py-2 px-3 font-bold text-slate-800">Total Realized Sales Inflow</td>
            <td className="py-2 px-3 text-right"></td>
            <td className="py-2 px-3 text-right font-bold text-slate-800">
              ৳ {pnl.gross_revenue?.toLocaleString('en-IN') || 0}
            </td>
          </tr>

          {/* COGS */}
          <tr>
            <td className="py-2 px-3 font-semibold text-red-700">Less: Cost of Goods Sold (COGS)</td>
            <td className="py-2 px-3 text-right"></td>
            <td className="py-2 px-3 text-right font-bold text-red-700">
              - ৳ {pnl.cogs?.toLocaleString('en-IN') || 0}
            </td>
          </tr>
          <tr className="text-slate-500 text-[11px]">
            <td className="py-1 px-3 pl-7">
              Direct inventory acquisition cost for {pnl.total_units_sold || 0} units delivered
            </td>
            <td className="py-1 px-3 text-right"></td>
            <td className="py-1 px-3 text-right"></td>
          </tr>

          {/* GROSS PROFIT ROW */}
          <tr className="bg-emerald-50 border-b-2 border-slate-900 font-bold">
            <td className="py-2.5 px-3 text-emerald-800 text-sm">
              GROSS TRADING PROFIT (Gross Margin: {pnl.gross_margin_pct}%)
            </td>
            <td className="py-2.5 px-3 text-right"></td>
            <td className="py-2.5 px-3 text-right text-emerald-700 text-sm font-extrabold">
              ৳ {pnl.gross_profit?.toLocaleString('en-IN') || 0}
            </td>
          </tr>

          {/* OPERATING EXPENSES */}
          <tr>
            <td className="py-2 px-3 font-semibold text-amber-800">Less: Operating & Shop Expenses</td>
            <td className="py-2 px-3 text-right"></td>
            <td className="py-2 px-3 text-right font-bold text-amber-800">
              - ৳ {pnl.operating_expenses?.toLocaleString('en-IN') || 0}
            </td>
          </tr>
          <tr className="text-slate-500 text-[11px]">
            <td className="py-1 px-3 pl-7">Shop bills, maintenance, salaries, office supplies, utilities</td>
            <td className="py-1 px-3 text-right"></td>
            <td className="py-1 px-3 text-right"></td>
          </tr>

          {/* NET PROFIT ROW */}
          <tr
            className={`border-b-4 border-double border-slate-900 ${
              isNetProfitPositive ? 'bg-blue-50' : 'bg-red-50'
            }`}
          >
            <td
              className={`py-3 px-3 font-extrabold text-sm ${
                isNetProfitPositive ? 'text-blue-900' : 'text-red-900'
              }`}
            >
              NET OPERATING PROFIT / (NET LOSS)
            </td>
            <td className="py-3 px-3 text-right font-bold text-slate-500">
              Net Margin: {pnl.net_margin_pct}%
            </td>
            <td
              className={`py-3 px-3 text-right font-extrabold text-base ${
                isNetProfitPositive ? 'text-blue-700' : 'text-red-700'
              }`}
            >
              ৳ {pnl.net_profit?.toLocaleString('en-IN') || 0}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Two-Column Financial Position Overview */}
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
            👥 Working Capital & Party Balances
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

      {/* Top 5 Revenue Generating Products */}
      {topProducts.length > 0 && (
        <div className="mb-7">
          <h4 className="text-xs font-bold text-slate-900 uppercase mb-2">
            🏆 Top Revenue Generating Products (In Selected Period)
          </h4>
          <table className="w-full border-collapse text-xs border border-slate-200">
            <thead>
              <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 font-bold">
                <th className="py-1.5 px-2.5 text-left">Product / SKU</th>
                <th className="py-1.5 px-2.5 text-center">Units Sold</th>
                <th className="py-1.5 px-2.5 text-right">Revenue (৳)</th>
                <th className="py-1.5 px-2.5 text-right">Estimated COGS (৳)</th>
                <th className="py-1.5 px-2.5 text-right">Gross Profit (৳)</th>
                <th className="py-1.5 px-2.5 text-right">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topProducts.slice(0, 5).map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-1.5 px-2.5 font-semibold text-slate-800">
                    {item.product_name}{' '}
                    <span className="text-slate-400 font-normal">({item.sku})</span>
                  </td>
                  <td className="py-1.5 px-2.5 text-center text-slate-700">{item.units_sold}</td>
                  <td className="py-1.5 px-2.5 text-right font-semibold text-slate-900">
                    ৳ {item.revenue_generated?.toLocaleString('en-IN')}
                  </td>
                  <td className="py-1.5 px-2.5 text-right text-slate-500">
                    ৳ {Number(item.total_cost || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-1.5 px-2.5 text-right font-bold text-emerald-600">
                    ৳ {item.profit?.toLocaleString('en-IN')}
                  </td>
                  <td className="py-1.5 px-2.5 text-right font-semibold text-slate-700">
                    {item.margin_pct}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Audit Signatures */}
      <div className="mt-12 flex justify-between pt-2">
        <div className="text-center w-44">
          <div className="border-t border-slate-400 pt-1.5 text-xs font-semibold text-slate-700">
            Prepared By
          </div>
          <span className="text-[11px] text-slate-400">Accountant / Officer</span>
        </div>
        <div className="text-center w-44">
          <div className="border-t border-slate-400 pt-1.5 text-xs font-semibold text-slate-700">
            Verified By
          </div>
          <span className="text-[11px] text-slate-400">Internal Auditor</span>
        </div>
        <div className="text-center w-44">
          <div className="border-t border-slate-400 pt-1.5 text-xs font-bold text-slate-900">
            Approved By
          </div>
          <span className="text-[11px] text-slate-400">Managing Director</span>
        </div>
      </div>

      <div className="text-center mt-7 text-[11px] text-slate-400">
        * This statement is an officially generated computer record from Sheba ERP/POS financial engine.
      </div>
    </div>
  );
}
