import React from "react";

export default function PrimaryMetrics({ stats, taka }) {
  const formatTaka = (val) => (taka ? taka(val) : `৳${Number(val || 0).toFixed(2)}`);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-3 sm:mb-5">
      {/* Today's Sales */}
      <div className="bg-white p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-xs border-t-4 border-t-emerald-500 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-center">
          <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
            Today's Sales
          </span>
          <span className="text-base sm:text-xl">📈</span>
        </div>
        <div className="text-base sm:text-2xl font-extrabold text-slate-900 mt-1 sm:mt-2 truncate">
          {formatTaka(stats.todaySales)}
        </div>
        <div className="text-[11px] sm:text-xs text-emerald-600 font-semibold mt-1 sm:mt-1.5 flex items-center gap-1">
          <span>{stats.todayOrdersCount} Orders Today</span>
        </div>
      </div>

      {/* Today's Purchases */}
      <div className="bg-white p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-xs border-t-4 border-t-sky-600 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-center">
          <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
            Today's Purchases
          </span>
          <span className="text-base sm:text-xl">📦</span>
        </div>
        <div className="text-base sm:text-2xl font-extrabold text-slate-900 mt-1 sm:mt-2 truncate">
          {formatTaka(stats.todayPurchases)}
        </div>
        <div className="text-[11px] sm:text-xs text-sky-600 font-semibold mt-1 sm:mt-1.5 flex items-center gap-1">
          <span>{stats.todayPurchasesCount} POs Received</span>
        </div>
      </div>

      {/* Total Inventory Asset Value */}
      <div className="bg-white p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-xs border-t-4 border-t-violet-500 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-center">
          <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
            Stock Asset (Cost)
          </span>
          <span className="text-base sm:text-xl">🏷️</span>
        </div>
        <div className="text-base sm:text-2xl font-extrabold text-slate-900 mt-1 sm:mt-2 truncate">
          {formatTaka(stats.inventoryCostValue)}
        </div>
        <div className="text-[11px] sm:text-xs text-slate-500 mt-1 sm:mt-1.5 truncate">
          Retail: <strong className="text-violet-600 font-bold">{formatTaka(stats.inventoryRetailValue)}</strong>
        </div>
      </div>

      {/* Net Available Liquidity */}
      <div className="bg-white p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-xs border-t-4 border-t-amber-500 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-center">
          <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
            Liquidity
          </span>
          <span className="text-base sm:text-xl">💰</span>
        </div>
        <div className="text-base sm:text-2xl font-extrabold text-slate-900 mt-1 sm:mt-2 truncate">
          {formatTaka(stats.totalWalletBalance)}
        </div>
        <div className="text-[11px] sm:text-xs text-slate-500 mt-1 sm:mt-1.5 truncate">
          Across {stats.walletCount} Accounts
        </div>
      </div>
    </div>
  );
}
