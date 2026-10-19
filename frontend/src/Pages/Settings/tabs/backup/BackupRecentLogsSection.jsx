import React from 'react';

export default function BackupRecentLogsSection({
  backupLogs = [],
  loadSettingsData,
  handleDownloadSqlBackup
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <span>📜</span> Recent Backup Event Logs
        </h4>
        <button
          type="button"
          onClick={() => loadSettingsData()}
          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-xs font-semibold text-slate-600 transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-md">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
            <tr>
              <th className="px-3 py-2">Backup Archive</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Size</th>
              <th className="px-3 py-2">Initiated By</th>
              <th className="px-3 py-2">Timestamp</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {backupLogs.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-3 py-4 text-center text-slate-400">
                  No backup event records available.
                </td>
              </tr>
            ) : (
              backupLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60">
                  <td className="px-3 py-2 font-mono text-slate-900 font-semibold">{log.backup_name}</td>
                  <td className="px-3 py-2 text-slate-600">{log.backup_type}</td>
                  <td className="px-3 py-2 font-semibold text-slate-700">{log.file_size}</td>
                  <td className="px-3 py-2 text-slate-600">{log.created_by}</td>
                  <td className="px-3 py-2 text-slate-500">
                    {log.created_at ? new Date(log.created_at).toLocaleString() : 'Just now'}
                  </td>
                  <td className="px-3 py-2">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      ✓ {log.status || 'SUCCESS'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={handleDownloadSqlBackup}
                      className="text-blue-600 hover:text-blue-800 font-bold text-xs"
                    >
                      📥 Download
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
