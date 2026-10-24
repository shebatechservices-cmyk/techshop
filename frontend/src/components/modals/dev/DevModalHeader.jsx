import React from 'react';

export default function DevModalHeader({
  onClose,
  onSwitchToUserMode,
  onDeveloperLogin,
  adminCreds,
}) {
  return (
    <div className="p-5 px-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 flex-wrap gap-3">
      <div className="flex items-center gap-3">
        <span className="text-2xl p-2 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">🛠️</span>
        <div>
          <div className="text-base font-extrabold text-sky-400 tracking-wider">
            SUPER ADMIN & DEVELOPER CONSOLE
          </div>
          <div className="text-xs text-slate-400">
            System Administration, Security & Force Overrides
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {onSwitchToUserMode && (
          <button
            type="button"
            onClick={onSwitchToUserMode}
            className="bg-rose-500/10 border border-rose-500/40 text-rose-300 hover:bg-rose-500/20 rounded-xl py-1.5 px-3 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Switch back to standard User Mode"
          >
            <span>👤</span>
            <span>User Mode</span>
          </button>
        )}
        {onDeveloperLogin && (
          <button
            type="button"
            onClick={() => onDeveloperLogin(adminCreds)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-1.5 px-3.5 text-xs font-bold shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1.5 cursor-pointer border-0"
          >
            <span>⚡</span>
            <span>Enter Super Admin</span>
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl py-1.5 px-3 text-xs border border-slate-700 transition-colors cursor-pointer"
        >
          ✕ Close
        </button>
      </div>
    </div>
  );
}
