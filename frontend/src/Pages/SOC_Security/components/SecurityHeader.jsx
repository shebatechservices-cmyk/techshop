import React from 'react';

export default function SecurityHeader({
  onRefresh,
  onOpenAddStaff,
  onOpenAddDevice,
  onOpenAddIp,
}) {
  return (
    <div className="flex justify-between items-center mb-5 flex-wrap gap-4">
      <div>
        <div className="flex items-center gap-2.5">
          <h2 className="text-[1.75rem] font-black text-slate-900 m-0 tracking-tight">
            🛡️ SOC Security &amp; Access Control
          </h2>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active Shield · Zero Trust Access
          </span>
        </div>
        <p className="text-slate-500 text-sm mt-1 mb-0">
          Enterprise Threat Operations, Staff &amp; Technician Access Control, Device Authorization, IP Firewall &amp; Granular Roles
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={onRefresh}
          className="px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold text-xs sm:text-sm cursor-pointer flex items-center gap-1.5 hover:bg-slate-50 transition-colors"
        >
          🔄 Refresh SOC
        </button>

        <button
          type="button"
          onClick={onOpenAddStaff}
          className="px-3.5 py-2 bg-slate-900 text-white rounded-lg font-bold text-xs sm:text-sm cursor-pointer hover:bg-slate-800 transition-colors border-0"
        >
          + Register Staff / Tech
        </button>

        <button
          type="button"
          onClick={onOpenAddDevice}
          className="px-3.5 py-2 bg-indigo-700 text-white rounded-lg font-bold text-xs sm:text-sm cursor-pointer hover:bg-indigo-800 transition-colors border-0"
        >
          + Authorize Device
        </button>

        <button
          type="button"
          onClick={onOpenAddIp}
          className="px-3.5 py-2 bg-rose-600 text-white rounded-lg font-bold text-xs sm:text-sm cursor-pointer hover:bg-rose-700 transition-colors border-0"
        >
          + Firewall IP Rule
        </button>
      </div>
    </div>
  );
}
