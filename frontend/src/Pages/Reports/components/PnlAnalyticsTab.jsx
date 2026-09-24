import React from 'react';

export default function PnlAnalyticsTab({ pnl = {}, channels = [] }) {
  const isNetProfitPositive = (pnl.net_profit || 0) >= 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs border-t-4 border-t-slate-800">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Gross Sales Revenue
          </span>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            ৳ {pnl.gross_revenue?.toLocaleString('en-IN') || 0}
          </div>
          <div className="text-xs text-slate-500 mt-1.5 font-medium">
            {pnl.total_invoices || 0} Invoices Billed
          </div>
        </div>

        {/* COGS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs border-t-4 border-t-red-600">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Cost of Goods (COGS)
          </span>
          <div className="text-2xl font-extrabold text-red-600 mt-2">
            ৳ {pnl.cogs?.toLocaleString('en-IN') || 0}
          </div>
          <div className="text-xs text-slate-500 mt-1.5 font-medium">
            Direct inventory acquisition cost
          </div>
        </div>

        {/* Gross Profit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs border-t-4 border-t-emerald-500">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Gross Profit
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {pnl.gross_margin_pct || 0}% Margin
            </span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-2">
            ৳ {pnl.gross_profit?.toLocaleString('en-IN') || 0}
          </div>
          <div className="text-xs text-emerald-600 mt-1.5 font-semibold">
            Sales minus purchase inventory cost
          </div>
        </div>

        {/* Net Profit */}
        <div
          className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-xs border-t-4 ${
            isNetProfitPositive ? 'border-t-blue-600' : 'border-t-red-600'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Net Operating Profit
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                isNetProfitPositive
                  ? 'text-blue-700 bg-blue-50 border-blue-200'
                  : 'text-red-700 bg-red-50 border-red-200'
              }`}
            >
              {pnl.net_margin_pct || 0}% Net
            </span>
          </div>
          <div
            className={`text-2xl font-extrabold mt-2 ${
              isNetProfitPositive ? 'text-blue-700' : 'text-red-700'
            }`}
          >
            ৳ {pnl.net_profit?.toLocaleString('en-IN') || 0}
          </div>
          <div className="text-xs text-slate-500 mt-1.5 font-medium">
            After shop operating expenses
          </div>
        </div>
      </div>

      {/* Accounting P&L Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>📑</span> Income Statement Breakdown (Double-Entry Ledger)
          </h3>
          <span className="text-xs text-slate-500 font-medium">All figures in BDT (৳)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold">
                <th className="py-2.5 px-4">Financial Particulars & Ledger Items</th>
                <th className="py-2.5 px-4 text-right w-44">Subtotal (৳)</th>
                <th className="py-2.5 px-4 text-right w-48">Amount (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50">
                <td className="py-3 px-4 font-bold text-slate-900">Gross Product Sales Revenue</td>
                <td className="py-3 px-4 text-right text-slate-400">—</td>
                <td className="py-3 px-4 text-right font-extrabold text-slate-900 text-sm">
                  ৳ {pnl.gross_revenue?.toLocaleString('en-IN') || 0}
                </td>
              </tr>
              <tr className="text-slate-500 hover:bg-slate-50">
                <td className="py-2 px-4 pl-8">Less: Trade Discounts & Rebates Given</td>
                <td className="py-2 px-4 text-right text-red-600 font-semibold">
                  - ৳ {pnl.total_discounts?.toLocaleString('en-IN') || 0}
                </td>
                <td className="py-2 px-4 text-right text-slate-400">—</td>
              </tr>
              <tr className="text-slate-500 hover:bg-slate-50">
                <td className="py-2 px-4 pl-8">Add: Value Added Tax (VAT / Tax Collected)</td>
                <td className="py-2 px-4 text-right text-emerald-700 font-semibold">
                  + ৳ {pnl.total_tax?.toLocaleString('en-IN') || 0}
                </td>
                <td className="py-2 px-4 text-right text-slate-400">—</td>
              </tr>
              <tr className="bg-slate-50 font-bold border-b border-slate-300">
                <td className="py-2.5 px-4 text-slate-800">Total Realized Sales Inflow</td>
                <td className="py-2.5 px-4 text-right text-slate-400">—</td>
                <td className="py-2.5 px-4 text-right font-bold text-slate-800">
                  ৳ {pnl.gross_revenue?.toLocaleString('en-IN') || 0}
                </td>
              </tr>

              {/* COGS */}
              <tr className="hover:bg-slate-50">
                <td className="py-3 px-4 font-bold text-red-700">Less: Cost of Goods Sold (COGS)</td>
                <td className="py-3 px-4 text-right text-slate-400">—</td>
                <td className="py-3 px-4 text-right font-extrabold text-red-700 text-sm">
                  - ৳ {pnl.cogs?.toLocaleString('en-IN') || 0}
                </td>
              </tr>
              <tr className="text-slate-500 text-[11px] hover:bg-slate-50">
                <td className="py-1 px-4 pl-8">
                  Direct inventory acquisition cost for {pnl.total_units_sold || 0} units delivered
                </td>
                <td className="py-1 px-4 text-right text-slate-400">—</td>
                <td className="py-1 px-4 text-right text-slate-400">—</td>
              </tr>

              {/* GROSS PROFIT ROW */}
              <tr className="bg-emerald-50 border-b-2 border-slate-900 font-extrabold">
                <td className="py-3 px-4 text-emerald-900 text-sm">
                  GROSS TRADING PROFIT (Gross Margin: {pnl.gross_margin_pct}%)
                </td>
                <td className="py-3 px-4 text-right text-slate-400">—</td>
                <td className="py-3 px-4 text-right text-emerald-700 text-base">
                  ৳ {pnl.gross_profit?.toLocaleString('en-IN') || 0}
                </td>
              </tr>

              {/* OPERATING EXPENSES */}
              <tr className="hover:bg-slate-50">
                <td className="py-3 px-4 font-bold text-amber-800">
                  Less: Operating & Shop Expenses
                </td>
                <td className="py-3 px-4 text-right text-slate-400">—</td>
                <td className="py-3 px-4 text-right font-extrabold text-amber-800 text-sm">
                  - ৳ {pnl.operating_expenses?.toLocaleString('en-IN') || 0}
                </td>
              </tr>
              <tr className="text-slate-500 text-[11px] hover:bg-slate-50">
                <td className="py-1 px-4 pl-8">
                  Shop bills, maintenance, salaries, office supplies, utilities
                </td>
                <td className="py-1 px-4 text-right text-slate-400">—</td>
                <td className="py-1 px-4 text-right text-slate-400">—</td>
              </tr>

              {/* NET PROFIT ROW */}
              <tr
                className={`border-b-4 border-double border-slate-900 font-black ${
                  isNetProfitPositive ? 'bg-blue-50' : 'bg-red-50'
                }`}
              >
                <td
                  className={`py-3.5 px-4 text-sm ${
                    isNetProfitPositive ? 'text-blue-950' : 'text-red-950'
                  }`}
                >
                  NET OPERATING PROFIT / (NET LOSS)
                </td>
                <td className="py-3.5 px-4 text-right text-slate-600 font-bold">
                  Net Margin: {pnl.net_margin_pct}%
                </td>
                <td
                  className={`py-3.5 px-4 text-right text-lg ${
                    isNetProfitPositive ? 'text-blue-700' : 'text-red-700'
                  }`}
                >
                  ৳ {pnl.net_profit?.toLocaleString('en-IN') || 0}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Inflow by Payment Channels */}
      {channels.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span>💳</span> Inflow by Payment Channel
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {channels.map((ch, i) => (
              <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-xs font-bold text-slate-700">{ch.method}</div>
                <div className="text-base font-extrabold text-slate-900 mt-1">
                  ৳ {Number(ch.total_amount || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">{ch.count} transactions</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
