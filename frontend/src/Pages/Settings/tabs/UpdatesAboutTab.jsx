import React from 'react';

export default function UpdatesAboutTab({
  handleCheckUpdates,
  updateChecking,
  updateStatus,
  showToast
}) {
  return (
    <div className="space-y-6">
      {/* Sub-page Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <span>Settings</span>
            <span>/</span>
            <span className="text-blue-600 font-bold">Updates & About</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>🚀</span> Software Version, Updates & Technical Support
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Check production stable release channels, inspect local deployment builds, and access 24/7 developer assistance.
          </p>
        </div>
      </div>

      {/* Version Status Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-sky-400">
            Current Deployment Channel
          </span>
          <h2 className="text-2xl font-black text-white mt-1 mb-1">
            Sheba POS & ERP Suite v2.8.4
          </h2>
          <p className="text-xs text-slate-400">
            Build Timestamp: September 2026 • Long-Term Support (LTS Production)
          </p>
        </div>

        <button
          type="button"
          onClick={handleCheckUpdates}
          disabled={updateChecking}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-xs font-bold shadow-md transition-colors flex items-center gap-2 shrink-0"
        >
          <span>{updateChecking ? '⏳' : '🔄'}</span>
          <span>{updateChecking ? 'Checking update servers...' : 'Check for Updates'}</span>
        </button>
      </div>

      {/* Update Result Banner */}
      {updateStatus && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-lg flex items-center gap-3 shadow-sm">
          <span className="text-xl">✅</span>
          <div>
            <strong className="text-sm font-bold block">Your system is running the latest stable build!</strong>
            <p className="text-xs text-emerald-700 mt-0.5">
              Installed: {updateStatus.currentVersion} • Release Channel: {updateStatus.channel || 'Stable'} • Last Checked: {updateStatus.lastChecked || 'Just now'}
            </p>
          </div>
        </div>
      )}

      {/* Developer Credits & Support Hotlines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-slate-200 rounded-lg p-5 bg-white shadow-sm space-y-2">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>🛠️</span> Software Architecture & Engineering
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Engineered and maintained by <strong>Sheba Technology Software Engineering Group</strong>.
          </p>
          <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-100">
            <div><strong>Engineering Core:</strong> Sheba Tech Systems</div>
            <div><strong>Support Email:</strong> support@shebatech.com.bd</div>
            <div><strong>Official Web:</strong> https://shebatech.com.bd</div>
          </div>
        </div>

        <div className="border border-slate-200 rounded-lg p-5 bg-white shadow-sm space-y-2">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>📞</span> 24/7 Technical Support Hotline
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            For operational assistance, custom report requests, or emergency assistance:
          </p>
          <div className="text-sm font-black text-blue-600">
            +880 1700-000000 / +880 1800-000000
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => showToast('Connecting to WhatsApp instant support...')}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
            >
              <span>💬</span>
              <span>WhatsApp Instant Helpdesk</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
