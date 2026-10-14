import React from 'react';

export default function SecurityKpiCards({ overview }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-5.5">
      {/* KPI 1: Health Score */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
            Security Posture
          </span>
          <span className="px-1.5 py-0.5 bg-emerald-100 rounded text-emerald-700 text-xs font-extrabold">
            EXCELLENT
          </span>
        </div>
        <div className="text-2xl font-black text-emerald-700">
          {overview.healthScore}%
        </div>
        <div className="text-xs text-slate-500 mt-1">
          Zero breach · Strict Zero-Trust
        </div>
      </div>

      {/* KPI 2: Staff & Techs */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
            Staff &amp; Tech Fleet
          </span>
          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 text-xs font-extrabold">
            ACCOUNTS
          </span>
        </div>
        <div className="text-2xl font-black text-slate-900">
          {overview.totalUsers}
        </div>
        <div className="text-xs text-slate-500 mt-1">
          {overview.technicians} Field Techs · {overview.lockedUsers} Locked
        </div>
      </div>

      {/* KPI 3: Blocked Threats */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-extrabold text-rose-700 uppercase tracking-wider">
            Threats &amp; Spam
          </span>
          <span className="px-1.5 py-0.5 bg-rose-100 rounded text-rose-700 text-xs font-extrabold">
            SHIELDED
          </span>
        </div>
        <div className="text-2xl font-black text-rose-700">
          {overview.totalBlockedAttempts}
        </div>
        <div className="text-xs text-slate-500 mt-1">
          Brute-force &amp; Spam attempts stopped
        </div>
      </div>

      {/* KPI 4: Trusted Devices */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider">
            Hardware Devices
          </span>
          <span className="px-1.5 py-0.5 bg-indigo-100 rounded text-indigo-700 text-xs font-extrabold">
            AUTH
          </span>
        </div>
        <div className="text-2xl font-black text-indigo-700">
          {overview.authorizedDevices} / {overview.totalDevices}
        </div>
        <div className="text-xs text-slate-500 mt-1">
          POS terminals &amp; mobile fingerprints
        </div>
      </div>

      {/* KPI 5: Firewall Rules */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-extrabold text-sky-700 uppercase tracking-wider">
            Firewall Perimeter
          </span>
          <span className="px-1.5 py-0.5 bg-sky-100 rounded text-sky-700 text-xs font-extrabold">
            IP RULES
          </span>
        </div>
        <div className="text-2xl font-black text-sky-700">
          {overview.ipRulesCount}
        </div>
        <div className="text-xs text-slate-500 mt-1">
          Static broadband whitelist active
        </div>
      </div>
    </div>
  );
}
