import React from 'react';

export default function BackupDangerZone({ setShowClearModal }) {
  const isDev = Boolean(
    import.meta.env?.DEV ||
    (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development')
  );

  if (!isDev) return null;

  return (
    <div className="border border-rose-200 bg-rose-50/50 rounded-xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="max-w-2xl space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-base">🚨</span>
            <h4 className="text-sm font-bold text-rose-900">
              Danger Zone: Purge Dummy &amp; Test Transaction Data
            </h4>
            <span className="bg-rose-200 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              Dev Only • Super Admin
            </span>
          </div>
          <p className="text-xs text-rose-700 leading-relaxed">
            Permanently delete all sales, purchases, invoices, ledger entries, and transaction history to prepare the system for fresh live operations.
            An automatic SQL snapshot is captured before any data is deleted.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-rose-800 pt-1">
            <span>🛡️ <strong>Preserved:</strong> Product Catalog, Categories, Settings &amp; Staff Users</span>
            <span>🗑️ <strong>Cleared:</strong> Dummy Sales, Purchases, Expenses &amp; Accounts Ledger</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowClearModal(true)}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm shadow-rose-500/30 transition-colors shrink-0 flex items-center gap-2 cursor-pointer"
        >
          <span>🧹</span>
          <span>Clear Dummy Data</span>
        </button>
      </div>
    </div>
  );
}
