import React from 'react';

export default function A4PerformanceBadges({ pnl, isNetProfitPositive }) {
  return (
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
  );
}
