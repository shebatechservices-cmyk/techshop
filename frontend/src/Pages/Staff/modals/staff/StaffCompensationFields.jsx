import React from 'react';

export default function StaffCompensationFields({
  formData,
  setFormData,
}) {
  return (
    <div className="pt-3 border-t border-slate-100">
      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <span>💼</span> Job Role, Payroll & Wallet
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Designation */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">
            Designation / Job Title
          </label>
          <input
            type="text"
            placeholder="e.g. Field Technician"
            value={formData.designation || ''}
            onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-100 text-slate-800"
          />
        </div>

        {/* Monthly Salary */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">
            Monthly Salary (৳)
          </label>
          <input
            type="number"
            placeholder="0.00"
            value={formData.salary || ''}
            onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-100 text-slate-800"
          />
        </div>

        {/* Wallet Balance */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">
            Personal Wallet (৳)
          </label>
          <input
            type="number"
            placeholder="0.00"
            value={formData.wallet_balance !== undefined ? formData.wallet_balance : ''}
            onChange={(e) => setFormData({ ...formData, wallet_balance: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-emerald-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-emerald-500 focus:ring-emerald-100 bg-emerald-50/30 font-semibold text-emerald-900"
          />
        </div>

        {/* Joining Date */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">
            Joining Date
          </label>
          <input
            type="date"
            value={formData.joining_date || ''}
            onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-100 text-slate-800"
          />
        </div>
      </div>
    </div>
  );
}
