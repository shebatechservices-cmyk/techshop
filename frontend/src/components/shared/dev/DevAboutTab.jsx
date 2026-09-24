import React from 'react';

export default function DevAboutTab({ systemInfo, devicesData, handleBypassLogin, loading, handleKickDevice }) {
  return (
    <div className="flex flex-col gap-5 text-xs font-mono">
      {/* Dev Environment Hero */}
      <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-5 shadow-sm">
        <div className="flex justify-between items-start flex-wrap gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-sky-400 flex items-center gap-2 m-0">
              <span>⚡</span> Sheba ERP Developer & Super Admin Core
            </h3>
            <p className="text-slate-400 text-xs mt-1 mb-0">
              Real-time Hardware Footprint, Diagnostic Telemetry & Remote Session Management.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleBypassLogin({ id: 1, name: 'Super Admin' })}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3.5 rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <span>👑 1-Click Root Super Admin Bypass</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-500 uppercase font-bold text-[10px]">App Version</span>
            <div className="text-sky-300 font-bold text-sm mt-0.5">{systemInfo?.version || 'v16.9.26-PRO'}</div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-500 uppercase font-bold text-[10px]">Environment</span>
            <div className="text-amber-400 font-bold text-sm mt-0.5">{systemInfo?.environment || 'Production (Local/Cloud)'}</div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-500 uppercase font-bold text-[10px]">Active Node</span>
            <div className="text-emerald-400 font-bold text-sm mt-0.5">{systemInfo?.node || 'Primary POS Host'}</div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-500 uppercase font-bold text-[10px]">DB Engine</span>
            <div className="text-purple-300 font-bold text-sm mt-0.5">SQLite / Better-Sqlite3</div>
          </div>
        </div>
      </div>

      {/* Connected Terminals & Devices */}
      <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-5 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider m-0">
            🖥️ Registered Desktop Terminals ({devicesData.counts?.desktop || 0}/1)
          </h4>
          <span className="text-[11px] text-slate-400">Enforced Hardware Limit: 1 PC</span>
        </div>

        {devicesData.desktops?.length === 0 ? (
          <p className="text-slate-500 text-xs m-0">No active desktop sessions logged.</p>
        ) : (
          <div className="space-y-2">
            {devicesData.desktops.map((dev) => (
              <div key={dev.id} className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex justify-between items-center flex-wrap gap-2">
                <div>
                  <div className="font-bold text-slate-200">{dev.device_name || 'Primary Desktop'}</div>
                  <div className="text-slate-400 text-[11px]">ID: {dev.device_id} • Last Seen: {new Date(dev.last_active_at).toLocaleString()}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleKickDevice(dev.device_id, dev.device_name)}
                  className="py-1 px-2.5 rounded-lg border border-rose-500/50 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 font-bold text-[11px] transition-colors"
                >
                  Kick / Free Slot
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-5 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider m-0">
            📱 Registered Mobile Handhelds ({devicesData.counts?.mobile || 0}/2)
          </h4>
          <span className="text-[11px] text-slate-400">Enforced Limit: 2 Mobile Devices</span>
        </div>

        {devicesData.mobiles?.length === 0 ? (
          <p className="text-slate-500 text-xs m-0">No active mobile sessions logged.</p>
        ) : (
          <div className="space-y-2">
            {devicesData.mobiles.map((dev) => (
              <div key={dev.id} className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex justify-between items-center flex-wrap gap-2">
                <div>
                  <div className="font-bold text-slate-200">{dev.device_name || 'Mobile POS'}</div>
                  <div className="text-slate-400 text-[11px]">ID: {dev.device_id} • Last Seen: {new Date(dev.last_active_at).toLocaleString()}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleKickDevice(dev.device_id, dev.device_name)}
                  className="py-1 px-2.5 rounded-lg border border-rose-500/50 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 font-bold text-[11px] transition-colors"
                >
                  Kick / Free Slot
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
