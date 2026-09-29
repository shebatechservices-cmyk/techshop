import React from 'react';

export default function ExpensesKpiCards({ overview = {}, expenses = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
      {/* Today's Expense */}
      <div className="bg-white rounded-lg border border-slate-200 py-2.5 px-3.5 shadow-xs">
        <div className="text-[0.74rem] font-bold text-slate-500 uppercase">
          Today's Expense
        </div>
        <div className="text-xl font-extrabold text-red-600 mt-0.5 font-mono">
          ৳ {Number(overview.total_today || 0).toLocaleString('en-IN')}
        </div>
        <div className="text-[0.72rem] text-slate-500">
          {overview.count_today || 0} vouchers today
        </div>
      </div>

      {/* This Month Total */}
      <div className="bg-white rounded-lg border border-slate-200 py-2.5 px-3.5 shadow-xs">
        <div className="text-[0.74rem] font-bold text-slate-500 uppercase">
          This Month Total
        </div>
        <div className="text-xl font-extrabold text-slate-900 mt-0.5 font-mono">
          ৳ {Number(overview.total_month || 0).toLocaleString('en-IN')}
        </div>
        <div className="text-[0.72rem] text-slate-500">
          {overview.count_month || 0} expenses this month
        </div>
      </div>

      {/* Cash Drawer Outflow */}
      <div className="bg-white rounded-lg border border-slate-200 py-2.5 px-3.5 shadow-xs">
        <div className="text-[0.74rem] font-bold text-slate-500 uppercase">
          Cash Drawer Outflow
        </div>
        <div className="text-xl font-extrabold text-amber-700 mt-0.5 font-mono">
          ৳{' '}
          {Number(
            expenses
              .filter(
                (e) =>
                  String(e.account_name).toLowerCase().includes('cash') ||
                  String(e.account_name).toLowerCase().includes('drawer')
              )
              .reduce((s, e) => s + Number(e.amount || 0), 0)
          ).toLocaleString('en-IN')}
        </div>
        <div className="text-[0.72rem] text-amber-800">
          Direct cash in hand
        </div>
      </div>

      {/* Top Category */}
      <div className="bg-white rounded-lg border border-slate-200 py-2.5 px-3.5 shadow-xs">
        <div className="text-[0.74rem] font-bold text-slate-500 uppercase">
          Top Category
        </div>
        <div className="text-lg font-extrabold text-sky-600 mt-0.5 truncate">
          {overview.category_breakdown?.[0]?.category_name || 'Rent & Utilities'}
        </div>
        <div className="text-[0.72rem] text-slate-500">
          ৳ {Number(overview.category_breakdown?.[0]?.total_amount || 3200).toLocaleString('en-IN')} (Highest)
        </div>
      </div>
    </div>
  );
}
