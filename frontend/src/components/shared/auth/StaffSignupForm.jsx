import React from 'react';

export default function StaffSignupForm({
  staffName,
  setStaffName,
  staffIdentifier,
  setStaffIdentifier,
  staffRole,
  setStaffRole,
  staffPassword,
  setStaffPassword,
  staffLoading,
  staffError,
  staffSuccess,
  handleStaffSignup,
  setMode,
}) {
  return (
    <form onSubmit={handleStaffSignup}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800">
          Staff Registration
        </h3>
        <button
          type="button"
          onClick={() => setMode('login')}
          className="text-xs text-slate-500 hover:text-slate-700 font-medium"
        >
          ← Back to Login
        </button>
      </div>

      <div className="mb-3.5">
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Full Name *
        </label>
        <input
          type="text"
          value={staffName}
          onChange={(e) => setStaffName(e.target.value)}
          placeholder="e.g. Md. Kamal Hossain"
          required
          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
        />
      </div>

      <div className="mb-3.5">
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Phone Number or Email *
        </label>
        <input
          type="text"
          value={staffIdentifier}
          onChange={(e) => setStaffIdentifier(e.target.value)}
          placeholder="017xxxxxxxx or staff@shebatech.com"
          required
          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
        />
      </div>

      <div className="mb-3.5">
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Staff Role
        </label>
        <select
          value={staffRole}
          onChange={(e) => setStaffRole(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all bg-white"
        >
          <option value="Sales Executive">Sales Executive</option>
          <option value="Field Technician">Field Technician</option>
          <option value="Inventory Officer">Inventory Officer</option>
          <option value="Accountant">Accountant</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Password *
        </label>
        <input
          type="password"
          value={staffPassword}
          onChange={(e) => setStaffPassword(e.target.value)}
          placeholder="At least 6 characters"
          required
          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
        />
      </div>

      {staffError && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium mb-3.5">
          {staffError}
        </div>
      )}

      {staffSuccess && (
        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium mb-3.5">
          {staffSuccess}
        </div>
      )}

      <button
        type="submit"
        disabled={staffLoading}
        className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
      >
        {staffLoading ? 'Submitting Application...' : 'Submit Application'}
      </button>
    </form>
  );
}
