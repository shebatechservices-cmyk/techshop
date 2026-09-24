import React from 'react';

export default function DevUpdatesTab({ systemInfo, fetchDevInfo }) {
  return (
    <div className="flex flex-col gap-4 text-xs font-mono">
      <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-5 shadow-sm">
        <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-3 m-0">
          Application Repository & Version Updates
        </h4>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 mb-4">
          <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
            <div>
              <div className="text-sm font-bold text-slate-100">
                Current Build: {systemInfo?.app?.version || 'v16.9.26-PRO'} ({systemInfo?.app?.gitCommit || 'HEAD'})
              </div>
              <div className="text-xs text-emerald-400 mt-0.5">
                Status: Production Ready • Up-to-date
              </div>
            </div>
            <button
              type="button"
              onClick={fetchDevInfo}
              className="py-1.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow transition-colors text-xs"
            >
              Check for Updates
            </button>
          </div>

          <div className="text-slate-400 text-xs leading-relaxed">
            Branch: <code className="text-sky-300">{systemInfo?.app?.gitBranch || 'main'}</code><br />
            Repository Path: <code className="text-slate-500">/home/sheba/sheba-technology</code>
          </div>
        </div>
      </div>
    </div>
  );
}
