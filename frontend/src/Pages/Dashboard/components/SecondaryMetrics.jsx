import React from "react";

export default function SecondaryMetrics({ stats, taka }) {
  const formatTaka = (val) => (taka ? taka(val) : `৳${Number(val || 0).toFixed(2)}`);
  const alertCount = (stats.lowStockCount || 0) + (stats.stockOutCount || 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-3 sm:mb-6">
      {/* Customer Receivables (Due) */}
      <div className="bg-white p-2.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-2.5 sm:gap-3.5 hover:shadow-md transition-shadow">
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-red-100 text-red-600 flex items-center justify-center text-base sm:text-xl flex-shrink-0">
          📥
        </div>
        <div className="min-w-0">
          <div className="text-[10px] sm:text-xs text-slate-500 font-semibold truncate">
            Due Receivables
          </div>
          <div className="text-sm sm:text-lg font-extrabold text-red-600 truncate">
            {formatTaka(stats.totalDueAmount)}
          </div>
        </div>
      </div>

      {/* Supplier Payables */}
      <div className="bg-white p-2.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-2.5 sm:gap-3.5 hover:shadow-md transition-shadow">
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-base sm:text-xl flex-shrink-0">
          📤
        </div>
        <div className="min-w-0">
          <div className="text-[10px] sm:text-xs text-slate-500 font-semibold truncate">
            Supplier Payables
          </div>
          <div className="text-sm sm:text-lg font-extrabold text-amber-600 truncate">
            {formatTaka(stats.supplierDueAmount)}
          </div>
        </div>
      </div>

      {/* Low & Out-of-Stock Alert */}
      <div className="bg-white p-2.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-2.5 sm:gap-3.5 hover:shadow-md transition-shadow">
        <div
          className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-base sm:text-xl flex-shrink-0 ${
            alertCount > 0
              ? "bg-red-100 text-red-600"
              : "bg-emerald-100 text-emerald-600"
          }`}
        >
          ⚠️
        </div>
        <div className="min-w-0">
          <div className="text-[10px] sm:text-xs text-slate-500 font-semibold truncate">
            Stock Alerts
          </div>
          <div className="text-sm sm:text-lg font-extrabold text-slate-900 truncate">
            {alertCount} Items
          </div>
        </div>
      </div>

      {/* Estimated Gross Profit Today */}
      <div className="bg-white p-2.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-2.5 sm:gap-3.5 hover:shadow-md transition-shadow">
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-base sm:text-xl flex-shrink-0">
          💹
        </div>
        <div className="min-w-0">
          <div className="text-[10px] sm:text-xs text-slate-500 font-semibold truncate">
            Today's Margin
          </div>
          <div className="text-sm sm:text-lg font-extrabold text-emerald-600 truncate">
            {formatTaka(stats.todayProfit)}
          </div>
        </div>
      </div>
    </div>
  );
}
