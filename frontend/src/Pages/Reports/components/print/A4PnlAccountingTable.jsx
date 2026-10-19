import React from 'react';

export default function A4PnlAccountingTable({ pnl, isNetProfitPositive }) {
  return (
    <table className="w-full border-collapse mb-6 text-xs">
      <thead>
        <tr className="bg-slate-900 text-white">
          <th className="py-2 px-3 text-left font-bold rounded-tl">Financial Particulars &amp; Ledger Items</th>
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
          <td className="py-1.5 px-3 pl-7">Less: Trade Discounts &amp; Rebates Given</td>
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
          <td className="py-2 px-3 font-semibold text-amber-800">Less: Operating &amp; Shop Expenses</td>
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
  );
}
