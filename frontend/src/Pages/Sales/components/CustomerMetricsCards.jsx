import React from 'react';

const money = (val) => Number.parseFloat(val || 0) || 0;
const defaultTaka = (val) => `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function CustomerMetricsCards({
  customersCount = 0,
  totalCustomerReceivables = 0,
  totalLoyaltyPoints = 0,
  taka = defaultTaka,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
      <div className="bg-white p-3 sm:px-3.5 sm:py-2.5 rounded-xl border border-slate-200 shadow-sm">
        <span className="text-[0.72rem] text-slate-500 font-semibold uppercase tracking-wider block">
          Total Registered Customers
        </span>
        <h3 className="text-xl font-extrabold text-sky-600 mt-1">
          {customersCount}
        </h3>
      </div>

      <div className="bg-white p-3 sm:px-3.5 sm:py-2.5 rounded-xl border border-slate-200 shadow-sm">
        <span className="text-[0.72rem] text-slate-500 font-semibold uppercase tracking-wider block">
          Outstanding Receivables
        </span>
        <h3 className={`text-xl font-extrabold mt-1 ${totalCustomerReceivables > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
          {taka(totalCustomerReceivables)}
        </h3>
      </div>

      <div className="bg-white p-3 sm:px-3.5 sm:py-2.5 rounded-xl border border-slate-200 shadow-sm">
        <span className="text-[0.72rem] text-slate-500 font-semibold uppercase tracking-wider block">
          Loyalty Points Distributed
        </span>
        <h3 className="text-xl font-extrabold text-amber-600 mt-1">
          {totalLoyaltyPoints.toLocaleString()} pts
        </h3>
      </div>
    </div>
  );
}
