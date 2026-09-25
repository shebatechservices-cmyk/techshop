import React from 'react';
import API from '../../../services/api';

export default function BackupRestoreTab({
  settings = {},
  setSettings = () => {},
  saving = false,
  handleSaveSettings = () => {},
  handleDownloadSqlBackup,
  downloadingBackup,
  handleExportJsonBackup,
  downloadingJson,
  handleTriggerBackup,
  backupLogs,
  loadSettingsData,
  backupFiles,
  loadingFiles,
  loadBackupFiles,
  setRestoreModal,
  uploadingBackup,
  handleUploadSqlFile,
  setShowClearModal
}) {
  return (
    <div className="space-y-6">
      {/* Sub-page Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <span>Settings</span>
            <span>/</span>
            <span className="text-blue-600 font-bold">Backup & Restore</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>💾</span> Database Safe Backup & Disaster Recovery
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure automated daily backup schedules, download full SQL dumps, export JSON snapshots, and restore databases.
          </p>
        </div>
      </div>

      {/* Quick Backup Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Full SQL Dump */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>📥</span> Full Database SQL Dump
            </h4>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              Complete SQL backup containing all tables, products, transactions, customers, and configuration states.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownloadSqlBackup}
            disabled={downloadingBackup}
            className="w-full py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-md text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5"
          >
            <span>{downloadingBackup ? '⌛' : '📥'}</span>
            <span>{downloadingBackup ? 'Generating Dump...' : 'Download SQL Dump'}</span>
          </button>
        </div>

        {/* JSON Snapshot */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>📦</span> Export JSON Snapshot
            </h4>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              Lightweight portable JSON snapshot suitable for quick audits, external migrations, and data verification.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportJsonBackup}
            disabled={downloadingJson}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-md text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5"
          >
            <span>{downloadingJson ? '⌛' : '📦'}</span>
            <span>{downloadingJson ? 'Exporting JSON...' : 'Export JSON Snapshot'}</span>
          </button>
        </div>

        {/* Instant Checkpoint */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>⚡</span> Instant Server Checkpoint
            </h4>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              Create an immediate server-side snapshot stored in local system backup archives without leaving the browser.
            </p>
          </div>
          <button
            type="button"
            onClick={handleTriggerBackup}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5"
          >
            <span>⚡</span>
            <span>Create Checkpoint Now</span>
          </button>
        </div>
      </div>

      {/* Auto Backup Schedule Config */}
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

      {/* Database Restore Hub & Archive List */}
      <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sky-100">
          <div>
            <h4 className="text-sm font-bold text-sky-900 flex items-center gap-2">
              <span>🔄</span> User Data & Database Restore Hub
            </h4>
            <p className="text-xs text-sky-700 mt-0.5">
              Restore your database from any saved snapshot, upload an external SQL file, or reload demo dataset.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setRestoreModal({ open: true, targetFile: null, isDemoRestore: true })}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <span>🌱</span>
              <span>Restore Demo Data</span>
            </button>

            <label className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5">
              <span>{uploadingBackup ? '⌛' : '📤'}</span>
              <span>{uploadingBackup ? 'Uploading...' : 'Upload .SQL File'}</span>
              <input
                type="file"
                accept=".sql"
                onChange={handleUploadSqlFile}
                disabled={uploadingBackup}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={loadBackupFiles}
              disabled={loadingFiles}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-bold transition-colors flex items-center gap-1"
            >
              <span>{loadingFiles ? '⌛' : '🔄'}</span>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Files Table */}
        {backupFiles.length === 0 ? (
          <div className="text-center py-8 bg-white border border-dashed border-sky-200 rounded-lg">
            <p className="text-xs text-slate-500 mb-2">No local backup files currently found in storage.</p>
            <button
              type="button"
              onClick={() => setRestoreModal({ open: true, targetFile: null, isDemoRestore: true })}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded text-xs font-bold transition-colors"
            >
              🌱 Load Sample Demo Dataset
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white border border-sky-200 rounded-lg shadow-sm">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="px-3 py-2">Backup File Name</th>
                  <th className="px-3 py-2">Snapshot Type</th>
                  <th className="px-3 py-2">Size</th>
                  <th className="px-3 py-2">Created Date</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {backupFiles.map((file, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="px-3 py-2.5 font-mono text-slate-900 font-semibold">
                      {file.fileName}
                      {file.isDemoGolden && (
                        <span className="ml-2 bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-bold">
                          DEMO SET
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        file.type?.includes('Auto')
                          ? 'bg-amber-100 text-amber-800'
                          : file.type?.includes('Demo')
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {file.type}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-slate-700">{file.sizeStr}</td>
                    <td className="px-3 py-2.5 text-slate-500">
                      {file.createdAt ? new Date(file.createdAt).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setRestoreModal({ open: true, targetFile: file, isDemoRestore: file.isDemoGolden })}
                          className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded text-[11px] font-bold transition-colors flex items-center gap-1"
                        >
                          <span>🔄</span>
                          <span>Restore</span>
                        </button>
                        <a
                          href={`${API}/settings/backup-download?fileName=${encodeURIComponent(file.fileName)}`}
                          download
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded text-[11px] font-bold transition-colors"
                          title="Download SQL File"
                        >
                          📥
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Backup Logs Table */}
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

      {/* Danger Zone: Clear Demo / Test Data */}
      <div className="border border-rose-200 bg-rose-50/50 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="max-w-2xl space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-base">🚨</span>
              <h4 className="text-sm font-bold text-rose-900">
                Danger Zone: Purge Dummy & Test Transaction Data
              </h4>
              <span className="bg-rose-200 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Super Admin Only
              </span>
            </div>
            <p className="text-xs text-rose-700 leading-relaxed">
              Permanently delete all sales, purchases, invoices, ledger entries, and transaction history to prepare the system for fresh live operations.
              An automatic SQL snapshot is captured before any data is deleted.
            </p>
            <div className="flex items-center gap-4 text-[11px] text-rose-800 pt-1">
              <span>🛡️ <strong>Preserved:</strong> Product Catalog, Categories, Settings & Staff Users</span>
              <span>🗑️ <strong>Cleared:</strong> Dummy Sales, Purchases, Expenses & Accounts Ledger</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowClearModal(true)}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm shadow-rose-500/30 transition-colors shrink-0 flex items-center gap-2"
          >
            <span>🧹</span>
            <span>Clear Dummy Data</span>
          </button>
        </div>
      </div>
    </div>
  );
}
