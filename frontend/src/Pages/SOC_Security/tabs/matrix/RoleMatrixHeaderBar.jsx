import React from 'react';

export default function RoleMatrixHeaderBar({
  roles = [],
  rolesPermMap = {},
  totalPermCount = 0,
  searchTerm = '',
  setSearchTerm,
  savingPerms,
  onSaveAll,
  onResetDefaults,
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 mb-5 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🛡️</span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Unified Role & Permission Matrix
            </h3>
            <span className="bg-slate-100 text-slate-700 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-slate-200">
              {roles.length} Roles • {totalPermCount} Privileges
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Configure system permissions for Super Admin, Admin, Cashier, Salesman, Staff, and Technician side-by-side. 
            Default privilege profiles are automatically mapped.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => onResetDefaults()}
            disabled={savingPerms}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Reset all roles to standard default permission templates"
          >
            <span>🔄</span>
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={onSaveAll}
            disabled={savingPerms}
            className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span>{savingPerms ? '⏳' : '💾'}</span>
            <span>{savingPerms ? 'Saving Matrix...' : 'Save All Permissions'}</span>
          </button>
        </div>
      </div>

      {/* Search & Quick Filters Bar */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Search permission (e.g. discount, cost, delete, drawer)..."
            className="w-full pl-3 pr-8 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all font-medium"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Role Quick Counts */}
        <div className="flex items-center gap-2 flex-wrap text-[11px]">
          {roles.map((r) => {
            const count = (rolesPermMap[r.id] || []).length;
            return (
              <span
                key={r.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-bold"
              >
                <span>{r.icon || '💼'}</span>
                <span>{r.name}:</span>
                <span className="text-teal-700 font-black">{count}</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
