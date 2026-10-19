import React from 'react';

export default function StoreProfileHeader({ saving, handleResetDummyShop, handleSaveSettings }) {
  return (
    <>
      {/* Sub-page Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <span>Settings</span>
            <span>/</span>
            <span className="text-blue-600 font-bold">Store Profile</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>🏢</span> Store & Business Profile
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your store identity, official contact details, addresses, and invoice header credentials.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetDummyShop}
            disabled={saving}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
            title="Prefill form with demo template data"
          >
            <span>✨</span>
            <span>Load Demo Data</span>
          </button>
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm shadow-blue-500/30 flex items-center gap-1.5"
          >
            <span>{saving ? '⏳' : '💾'}</span>
            <span>{saving ? 'Saving...' : 'Save Profile'}</span>
          </button>
        </div>
      </div>

      {/* Tip Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-xs text-slate-600 flex items-start sm:items-center gap-3">
        <span className="text-base shrink-0">💡</span>
        <p className="leading-relaxed">
          <strong>Store Information Setup:</strong> These credentials automatically populate your thermal invoice receipts, cash memos, customer statements, and system notifications. Click <strong>'Save Profile'</strong> after making changes.
        </p>
      </div>
    </>
  );
}
