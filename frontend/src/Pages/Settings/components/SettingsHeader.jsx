import React from 'react';
import { useSettings } from '../context/SettingsContext';

export default function SettingsHeader(props) {
  const context = useSettings();
  const downloadingBackup = props.downloadingBackup ?? context.downloadingBackup ?? false;
  const handleDownloadSqlBackup = props.handleDownloadSqlBackup ?? context.handleDownloadSqlBackup;
  const setIsLocked = props.setIsLocked ?? context.setIsLocked;
  const onLogout = props.onLogout ?? context.onLogout;
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 mb-4 flex flex-wrap justify-between items-center gap-3">
      {/* Left: Compact Title & Badge */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">⚙️</span>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
              Settings & Preferences
            </h2>
            <span className="bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
              v2.8.4 Enterprise
            </span>
          </div>
          <span className="text-slate-500 text-xs mt-0.5 block">
            Manage shop profiles, POS terminal settings, print designs, and integrations
          </span>
        </div>
      </div>

      {/* Right: Quick Action Buttons */}
      <div className="flex gap-2 items-center flex-wrap">
        <button
          type="button"
          onClick={handleDownloadSqlBackup}
          disabled={downloadingBackup}
          className={`bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm transition ${
            downloadingBackup ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
          }`}
          title="Download full database SQL dump"
        >
          <span>{downloadingBackup ? '⌛' : '📥'}</span>
          <span>{downloadingBackup ? 'Backing up...' : 'SQL Backup'}</span>
        </button>

        <button
          type="button"
          onClick={() => setIsLocked(true)}
          className="bg-white hover:bg-slate-50 border border-slate-300 px-3.5 py-1.5 rounded-lg text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          title="Lock screen session"
        >
          <span>🔒</span>
          <span>Lock</span>
        </button>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-red-600/25 transition cursor-pointer"
            title="Log out from Sheba ERP"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        )}
      </div>
    </div>
  );
}
