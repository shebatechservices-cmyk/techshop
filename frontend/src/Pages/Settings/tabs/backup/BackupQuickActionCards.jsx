import React from 'react';

export default function BackupQuickActionCards({
  handleDownloadSqlBackup,
  downloadingBackup,
  handleExportJsonBackup,
  downloadingJson,
  handleTriggerBackup
}) {
  return (
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
  );
}
