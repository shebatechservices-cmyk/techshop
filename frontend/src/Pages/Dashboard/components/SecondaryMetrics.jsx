import React from "react";

export default function SecondaryMetrics({ stats, taka }) {
  const formatTaka = (val) => (taka ? taka(val) : `৳${Number(val || 0).toFixed(2)}`);
  const alertCount = (stats.lowStockCount || 0) + (stats.stockOutCount || 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Customer Receivables (Due) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:shadow-md transition-shadow">
        <div className="w-11 h-11 rounded-xl bg-red-100 text-red-600 flex items-center justify-center text-xl flex-shrink-0">
          📥
        </div>
        <div className="min-w-0">
          <div className="text-xs text-slate-500 font-semibold truncate">
            Customer Receivables (Due)
          </div>
          <div className="text-lg font-extrabold text-red-600 truncate">
            {formatTaka(stats.totalDueAmount)}
          </div>
        </div>
      </div>

      {/* Supplier Payables */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:shadow-md transition-shadow">
        <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl flex-shrink-0">
          📤
        </div>
        <div className="min-w-0">
          <div className="text-xs text-slate-500 font-semibold truncate">
            Supplier Payables (Due)
          </div>
          <div className="text-lg font-extrabold text-amber-600 truncate">
            {formatTaka(stats.supplierDueAmount)}
          </div>
        </div>
      </div>

      {/* Low & Out-of-Stock Alert */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:shadow-md transition-shadow">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
            alertCount > 0
              ? "bg-red-100 text-red-600"
              : "bg-emerald-100 text-emerald-600"
          }`}
        >
          ⚠️
        </div>
        <div className="min-w-0">
          <div className="text-xs text-slate-500 font-semibold truncate">
            Low & Out-of-Stock
          </div>
          <div className="text-lg font-extrabold text-slate-900 truncate">
            {alertCount} Items
          </div>
        </div>
      </div>

      {/* Estimated Gross Profit Today */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:shadow-md transition-shadow">
        <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl flex-shrink-0">
          💹
        </div>
        <div className="min-w-0">
          <div className="text-xs text-slate-500 font-semibold truncate">
            Today's Est. Margin
          </div>
          <div className="text-lg font-extrabold text-emerald-600 truncate">
            {formatTaka(stats.todayProfit)}
          </div>
        </div>
      </div>
    </div>
  );
}
