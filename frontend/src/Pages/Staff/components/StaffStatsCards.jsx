import React from 'react';

export default function StaffStatsCards({ stats = {} }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Staff</span>
        <div className="flex items-baseline justify-between mt-2">
          <span className="text-2xl font-black text-slate-800">{stats.totalStaff || 0}</span>
          <span className="text-lg">👥</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
        <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Active Employees</span>
        <div className="flex items-baseline justify-between mt-2">
          <span className="text-2xl font-black text-emerald-600">{stats.activeStaff || 0}</span>
          <span className="text-lg">🟢</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
        <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Admins / Managers</span>
        <div className="flex items-baseline justify-between mt-2">
          <span className="text-2xl font-black text-indigo-700">{stats.adminCount || 0}</span>
          <span className="text-lg">🛡️</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
        <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Technicians</span>
        <div className="flex items-baseline justify-between mt-2">
          <span className="text-2xl font-black text-amber-600">{stats.techCount || 0}</span>
          <span className="text-lg">🔧</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Monthly Payroll</span>
        <div className="flex items-baseline justify-between mt-2">
          <span className="text-xl font-black text-slate-900">
            ৳{(stats.totalMonthlyPayroll || 0).toLocaleString()}
          </span>
          <span className="text-lg">💰</span>
        </div>
      </div>
    </div>
  );
}
