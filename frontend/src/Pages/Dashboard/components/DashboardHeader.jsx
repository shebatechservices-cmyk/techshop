import React from "react";

export default function DashboardHeader({
  refreshing,
  countdown,
  formatCountdown,
  onRefresh,
}) {
  return (
    <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
          <span>📊</span>
          <span>ERP Management Dashboard</span>
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Real-time business performance, liquidity, and operational metrics
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Live Status indicator */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-800">
          <span
            className={`w-2 h-2 rounded-full ${
              refreshing ? "bg-amber-500 animate-ping" : "bg-emerald-500"
            }`}
          />
          <span>
            {refreshing
              ? "Updating live..."
              : `Live · Next in ${formatCountdown ? formatCountdown(countdown) : `${countdown}s`}`}
          </span>
        </div>

        {/* Refresh button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold text-xs shadow-2xs hover:bg-slate-50 transition ${
            refreshing ? "opacity-70 cursor-not-allowed" : "cursor-pointer"
          }`}
          title="Refresh now"
        >
          <span className={refreshing ? "animate-spin" : ""}>🔄</span>
          <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>
    </div>
  );
}
