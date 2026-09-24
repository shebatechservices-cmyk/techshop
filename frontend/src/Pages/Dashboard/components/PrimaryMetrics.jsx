import React from "react";

export default function PrimaryMetrics({ stats, taka }) {
  const formatTaka = (val) => (taka ? taka(val) : `৳${Number(val || 0).toFixed(2)}`);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
      {/* Today's Sales */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs border-t-4 border-t-emerald-500 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Today's Sales
          </span>
          <span className="text-xl">📈</span>
        </div>
        <div className="text-2xl font-extrabold text-slate-900 mt-2">
          {formatTaka(stats.todaySales)}
        </div>
        <div className="text-xs text-emerald-600 font-semibold mt-1.5 flex items-center gap-1">
          <span>{stats.todayOrdersCount} Orders Today</span>
        </div>
      </div>

      {/* Today's Purchases */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs border-t-4 border-t-sky-600 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Today's Purchases
          </span>
          <span className="text-xl">📦</span>
        </div>
        <div className="text-2xl font-extrabold text-slate-900 mt-2">
          {formatTaka(stats.todayPurchases)}
        </div>
        <div className="text-xs text-sky-600 font-semibold mt-1.5 flex items-center gap-1">
          <span>{stats.todayPurchasesCount} POs Received</span>
        </div>
      </div>

      {/* Total Inventory Asset Value */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs border-t-4 border-t-violet-500 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Stock Asset (Cost Value)
          </span>
          <span className="text-xl">🏷️</span>
        </div>
        <div className="text-2xl font-extrabold text-slate-900 mt-2">
          {formatTaka(stats.inventoryCostValue)}
        </div>
        <div className="text-xs text-slate-500 mt-1.5">
          Retail Value: <strong className="text-violet-600 font-bold">{formatTaka(stats.inventoryRetailValue)}</strong>
        </div>
      </div>

      {/* Net Available Liquidity */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs border-t-4 border-t-amber-500 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Available Liquidity
          </span>
          <span className="text-xl">💰</span>
        </div>
        <div className="text-2xl font-extrabold text-slate-900 mt-2">
          {formatTaka(stats.totalWalletBalance)}
        </div>
        <div className="text-xs text-slate-500 mt-1.5">
          Across {stats.walletCount} Cash & Bank Accounts
        </div>
      </div>
    </div>
  );
}
