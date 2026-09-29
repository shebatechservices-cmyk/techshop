import React from 'react';

export default function StaffHeader({
  loading = false,
  refreshStaff = () => {},
  openCreateModal = () => {}
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
          <span>Management</span>
          <span>/</span>
          <span className="text-blue-600 font-bold">Staff & Employees</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
          <span className="text-2xl">👥</span>
          <span>Staff & Team Management</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage system users, login credentials, role assignments, designations, and employee payroll.
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={refreshStaff}
          disabled={loading}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          title="Refresh list"
        >
          <span className={loading ? 'animate-spin' : ''}>🔄</span>
          <span className="hidden sm:inline">Refresh</span>
        </button>
        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <span>➕</span>
          <span>Add New Staff</span>
        </button>
      </div>
    </div>
  );
}
