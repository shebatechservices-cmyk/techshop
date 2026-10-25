import React from 'react';

export default function SalesMetrics({
  totalSalesVolume,
  totalInvoices,
  totalCollectedAmount,
  totalSalesDue,
  taka,
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-3">
      {/* 1. Total Sales Volume */}
      <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
        <span className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider block truncate">
          Total Sales Volume
        </span>
        <h3 className="text-sm sm:text-lg m-0 mt-1 text-emerald-600 font-black truncate leading-tight">
          {taka(totalSalesVolume)}
        </h3>
      </div>

      {/* 2. Total Invoices */}
      <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
        <span className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider block truncate">
          Total Invoices
        </span>
        <h3 className="text-sm sm:text-lg m-0 mt-1 text-slate-900 font-black truncate leading-tight">
          {totalInvoices}
        </h3>
      </div>

      {/* 3. Total Collected (Paid) */}
      <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
        <span className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider block truncate">
          Collected (Paid)
        </span>
        <h3 className="text-sm sm:text-lg m-0 mt-1 text-sky-600 font-black truncate leading-tight">
          {taka(totalCollectedAmount)}
        </h3>
      </div>

      {/* 4. Outstanding Due */}
      <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
        <span className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider block truncate">
          Outstanding Due
        </span>
        <h3
          className={`text-sm sm:text-lg m-0 mt-1 font-black truncate leading-tight ${
            totalSalesDue > 0 ? 'text-rose-600' : 'text-emerald-600'
          }`}
        >
          {taka(totalSalesDue)}
        </h3>
      </div>
    </div>
  );
}
