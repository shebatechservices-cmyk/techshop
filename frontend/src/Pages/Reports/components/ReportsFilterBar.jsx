import React from 'react';

export default function ReportsFilterBar({
  period,
  setPeriod,
  customFrom,
  setCustomFrom,
  customTo,
  setCustomTo,
  activeTab,
  setActiveTab,
  onPrintOpen,
  onExportCsv,
}) {
  const PERIODS = [
    { id: 'today', label: 'Today (আজ)' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: '7days', label: 'Last 7 Days' },
    { id: '30days', label: 'Last 30 Days' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'this_year', label: 'This Year' },
    { id: 'all', label: 'All Time' },
    { id: 'custom', label: 'Custom Range' },
  ];

  const TABS = [
    { id: 'pnl', label: '📊 Profit & Loss (P&L)', desc: 'Revenue, COGS & Margins' },
    { id: 'top_products', label: '🏆 Top Selling Items', desc: 'Best Performing SKUs' },
    { id: 'inventory', label: '📦 Inventory Asset Valuation', desc: 'Stock Worth & Profit Potential' },
    { id: 'ledgers', label: '👥 Financial Ledgers & Cash', desc: 'Receivables, Payables & Wallets' },
    { id: 'sales_audit', label: '🔍 Sales Audit Trail (200)', desc: 'Line Item Audit Logs' },
  ];

  return (
    <div className="space-y-4 mb-6">
      {/* Top Header & Export / Print Actions */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">📈</span>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 leading-tight">
              Financial Reporting & Business Intelligence
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive double-entry profitability, inventory valuation, and sales audit registers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onPrintOpen}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <span>🖨️</span> Print Statements
          </button>
          <button
            type="button"
            onClick={onExportCsv}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/25 transition cursor-pointer"
          >
            <span>📥</span> Export Audit (CSV)
          </button>
        </div>
      </div>

      {/* Date Period Filter Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-500 mr-2 uppercase tracking-wider whitespace-nowrap">
            Period:
          </span>
          {PERIODS.map((p) => {
            const isSelected = period === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  isSelected
                    ? 'bg-sky-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Custom Range Inputs */}
        {period === 'custom' && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 flex-wrap text-xs">
            <div className="flex items-center gap-2">
              <label className="font-bold text-slate-700">From:</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="font-bold text-slate-700">To:</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Primary Analytics Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                isActive
                  ? 'bg-white border-sky-500 shadow-sm ring-2 ring-sky-500/10'
                  : 'bg-white/60 border-slate-200 hover:bg-white hover:border-slate-300'
              }`}
            >
              <div
                className={`text-xs font-bold truncate ${
                  isActive ? 'text-sky-600' : 'text-slate-800'
                }`}
              >
                {tab.label}
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">{tab.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
