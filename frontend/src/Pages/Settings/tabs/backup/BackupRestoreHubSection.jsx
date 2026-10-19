import React from 'react';
import API from '../../../../services/api';

export default function BackupRestoreHubSection({
  setRestoreModal,
  uploadingBackup,
  handleUploadSqlFile,
  backupFiles,
  loadingFiles,
  loadBackupFiles
}) {
  return (
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
  );
}
