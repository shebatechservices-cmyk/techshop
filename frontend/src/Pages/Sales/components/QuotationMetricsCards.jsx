import React from 'react';

export default function QuotationMetricsCards({
  quotationsCount = 0,
  totalQuotationValue = 0,
  acceptedQuotationsCount = 0,
  taka = (val) => val
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
      <div className="bg-white p-3 sm:px-3.5 sm:py-2.5 rounded-xl border border-slate-200 shadow-sm">
        <span className="text-[0.72rem] text-slate-500 font-semibold uppercase tracking-wider block">
          Total Quotations
        </span>
        <h3 className="text-xl font-extrabold text-indigo-600 mt-1">
          {quotationsCount}
        </h3>
      </div>

      <div className="bg-white p-3 sm:px-3.5 sm:py-2.5 rounded-xl border border-slate-200 shadow-sm">
        <span className="text-[0.72rem] text-slate-500 font-semibold uppercase tracking-wider block">
          Total Quoted Value
        </span>
        <h3 className="text-xl font-extrabold text-slate-900 mt-1">
          {typeof taka === 'function' ? taka(totalQuotationValue) : `${taka}${totalQuotationValue}`}
        </h3>
      </div>

      <div className="bg-white p-3 sm:px-3.5 sm:py-2.5 rounded-xl border border-slate-200 shadow-sm">
        <span className="text-[0.72rem] text-slate-500 font-semibold uppercase tracking-wider block">
          Accepted Quotes
        </span>
        <h3 className="text-xl font-extrabold text-emerald-600 mt-1">
          {acceptedQuotationsCount}
        </h3>
      </div>
    </div>
  );
}
