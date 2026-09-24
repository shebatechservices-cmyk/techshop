import React from 'react';

export default function SalesMetrics({
  totalSalesVolume,
  totalInvoices,
  totalCollectedAmount,
  totalSalesDue,
  taka,
}) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2.5 mb-3.5">
      <div className="bg-white p-2.5 px-3.5 rounded-xl border border-slate-200 shadow-sm">
        <span className="text-[0.72rem] text-slate-500 font-semibold uppercase tracking-wider">
          Total Sales Volume
        </span>
        <h3 className="text-xl m-0 mt-1 text-green-600 font-extrabold">{taka(totalSalesVolume)}</h3>
      </div>
      <div className="bg-white p-2.5 px-3.5 rounded-xl border border-slate-200 shadow-sm">
        <span className="text-[0.72rem] text-slate-500 font-semibold uppercase tracking-wider">
          Total Invoices
        </span>
        <h3 className="text-xl m-0 mt-1 text-slate-900 font-extrabold">{totalInvoices}</h3>
      </div>
      <div className="bg-white p-2.5 px-3.5 rounded-xl border border-slate-200 shadow-sm">
        <span className="text-[0.72rem] text-slate-500 font-semibold uppercase tracking-wider">
          Total Collected (Paid)
        </span>
        <h3 className="text-xl m-0 mt-1 text-sky-600 font-extrabold">{taka(totalCollectedAmount)}</h3>
      </div>
      <div className="bg-white p-2.5 px-3.5 rounded-xl border border-slate-200 shadow-sm">
        <span className="text-[0.72rem] text-slate-500 font-semibold uppercase tracking-wider">
          Outstanding Due
        </span>
        <h3
          className={`text-xl m-0 mt-1 font-extrabold ${
            totalSalesDue > 0 ? 'text-red-500' : 'text-emerald-500'
          }`}
        >
          {taka(totalSalesDue)}
        </h3>
      </div>
    </div>
  );
}
