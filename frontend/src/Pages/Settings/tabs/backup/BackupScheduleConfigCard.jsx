import React from 'react';

export default function BackupScheduleConfigCard({
  settings,
  setSettings,
  handleSaveSettings,
  saving
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
        <span>⏰</span> Automated Daily Backup Schedule
      </h4>
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={!!settings?.auto_backup_enabled}
            onChange={(e) => setSettings({ ...settings, auto_backup_enabled: e.target.checked })}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <span>Enable Automated Daily Backups</span>
        </label>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Execution Time:</span>
          <input
            type="time"
            value={settings?.auto_backup_time || '02:00'}
            onChange={(e) => setSettings({ ...settings, auto_backup_time: e.target.value })}
            className="px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={saving}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white rounded text-xs font-bold transition-colors ml-auto"
        >
          {saving ? 'Saving...' : 'Save Schedule'}
        </button>
      </div>
    </div>
  );
}
