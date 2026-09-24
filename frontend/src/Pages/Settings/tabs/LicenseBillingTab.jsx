import React from 'react';

export default function LicenseBillingTab({
  settings,
  licenseInfo,
  stats,
  copyText,
  syncingHeartbeat,
  handleTriggerHeartbeat,
  redemptionCode,
  setRedemptionCode,
  redeeming,
  handleRedeemCode,
  redemptionResult,
  saving,
  handleSaveSettings
}) {
  return (
    <div className="space-y-6">
      {/* Sub-page Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <span>Settings</span>
            <span>/</span>
            <span className="text-blue-600 font-bold">License & Billing</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>💳</span> License, Subscription & Billing Management
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            View commercial license validity, cloud domain status, hardware metrics, and redeem annual renewal keys.
          </p>
        </div>

        <button
          type="button"
          onClick={handleTriggerHeartbeat}
          disabled={syncingHeartbeat}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
        >
          <span>{syncingHeartbeat ? '⏳' : '🔄'}</span>
          <span>{syncingHeartbeat ? 'Syncing...' : 'Sync with Vendor (Heartbeat)'}</span>
        </button>
      </div>

      {/* Top Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Enterprise License */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
                Enterprise License
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                licenseInfo?.status === 'suspended' || licenseInfo?.status === 'expired'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                ● {licenseInfo?.status ? licenseInfo.status.toUpperCase() : 'ACTIVE'}
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">Sheba POS & ERP Suite</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Registered to: <strong>{settings.shop_name}</strong>
            </p>

            <div className="bg-slate-50 border border-slate-200 p-2 rounded text-xs font-mono text-slate-800 flex justify-between items-center my-2">
              <span className="truncate pr-1">{licenseInfo?.full_license_key || settings.license_key || 'SHEBA-ENT-2026-X99-PRO'}</span>
              <button
                type="button"
                onClick={() => copyText(licenseInfo?.full_license_key || settings.license_key, 'License key copied!')}
                className="text-slate-400 hover:text-slate-700 text-xs"
                title="Copy Key"
              >
                📋
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 flex justify-between items-center">
            <span>Expiry:</span>
            <div className="flex items-center gap-1.5">
              <strong className="text-slate-900 font-bold">
                {licenseInfo?.license_expiry
                  ? new Date(licenseInfo.license_expiry).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                  : 'Active'}
              </strong>
              {licenseInfo?.license_days_left !== undefined && (
                <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold border border-blue-200">
                  {licenseInfo.license_days_left}d left
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Cloud Hosting & Domain */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">
                Domain & SSL
              </span>
              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200">
                🔒 TLS 1.3 Active
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 truncate">
              {licenseInfo?.domain_name || settings.domain_name || 'shebatech.com.bd'}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              SSL: <strong>Let's Encrypt Wildcard</strong>
            </p>

            <div className="bg-slate-50 border border-slate-200 p-2 rounded text-xs text-slate-700 my-2 space-y-1">
              <div className="flex justify-between">
                <span>Domain Expiration:</span>
                <strong>{licenseInfo?.domain_expiry ? new Date(licenseInfo.domain_expiry).toLocaleDateString('en-GB') : (settings.domain_expiry || '2027-01-15')}</strong>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Hosting Expiry:</span>
                <span>{licenseInfo?.hosting_expiry ? new Date(licenseInfo.hosting_expiry).toLocaleDateString('en-GB') : '2027-09-17'}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-xs text-slate-600">
            Server OS: <strong>{settings.hosting_server || 'Ubuntu 24.04 LTS'}</strong>
          </div>
        </div>

        {/* Card 3: Server Hardware Specs */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600">
                Server Hardware
              </span>
              <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-purple-200">
                99.98% Uptime
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">Dedicated POS Node</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Cluster: <strong>High-Availability Multi-Tenant</strong>
            </p>

            <div className="bg-slate-50 border border-slate-200 p-2 rounded text-xs text-slate-700 my-2 space-y-1">
              <div className="flex justify-between">
                <span>RAM Heap:</span>
                <strong>{stats.memoryUsage || '42 MB'} / 16 GB</strong>
              </div>
              <div className="flex justify-between">
                <span>System Uptime:</span>
                <strong>{stats.uptimeFormatted || '48d 14h'}</strong>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-xs text-slate-600">
            Runtime: <strong>Node.js {stats.nodeVersion || 'v24.20.0'}</strong>
          </div>
        </div>

        {/* Card 4: Vendor Heartbeat & App ID */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-600">
                Vendor Integration
              </span>
              <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-teal-200">
                Live Heartbeat
              </span>
            </div>
            <div className="text-xs text-slate-700 space-y-1 mb-2">
              <div>
                <span className="text-slate-400">Client App ID: </span>
                <strong className="font-mono text-teal-700">{licenseInfo?.client_app_id || settings.client_app_id || 'CLIENT-SHEBA-TECH-8801'}</strong>
              </div>
              <div className="truncate">
                <span className="text-slate-400">Vendor API: </span>
                <span className="font-mono text-[11px]">{licenseInfo?.vendor_api_url || 'http://localhost:5000'}</span>
              </div>
              <div>
                <span className="text-slate-400">Hardware Fingerprint: </span>
                <span className="font-mono text-[11px] font-bold">{licenseInfo?.hardware_id || 'SHEBA-HW-NODE-8801'}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-xs text-slate-500">
            Last Synced: <strong>{licenseInfo?.last_sync_at ? new Date(licenseInfo.last_sync_at).toLocaleTimeString() : 'Live'}</strong>
          </div>
        </div>
      </div>

      {/* Redemption Code Form */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 text-white shadow-md">
        <div className="flex items-center gap-2.5 mb-2">
          <span className="text-2xl">🎁</span>
          <h4 className="text-base font-bold text-white">
            Redeem License Activation or Annual Renewal Code
          </h4>
        </div>
        <p className="text-xs text-slate-400 mb-4 max-w-2xl leading-relaxed">
          Enter an activation or subscription voucher code received from your provider to extend your annual commercial license, unlock features, or renew cloud hosting.
        </p>

        <form onSubmit={handleRedeemCode} className="flex gap-2 flex-wrap mb-4">
          <input
            type="text"
            value={redemptionCode}
            onChange={(e) => setRedemptionCode(e.target.value)}
            placeholder="e.g. VEND-5KQS-BC4V-EXKM-CVBR, REN-2026-XXXX, or SHEBA-ENT-PRO"
            className="flex-1 min-w-[280px] px-4 py-2.5 bg-slate-950/80 border border-slate-700 rounded-lg text-white font-mono text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={redeeming}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-bold shadow-md transition-colors flex items-center gap-2"
          >
            <span>{redeeming ? '⏳' : '🚀'}</span>
            <span>{redeeming ? 'Verifying...' : 'Redeem Code'}</span>
          </button>
        </form>

        {/* Feature Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-500">Supported Actions:</span>
          <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">
            🔑 Full License Activation
          </span>
          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
            ⏱️ 1-Year Commercial Renewal
          </span>
          <span className="px-2.5 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md">
            🌐 Cloud & Domain Extension
          </span>
        </div>

        {/* Redemption Result Banner */}
        {redemptionResult && (
          <div className={`mt-4 p-3 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
            redemptionResult.success
              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500 text-rose-300'
          }`}>
            <span>{redemptionResult.success ? '✓' : '⚠️'}</span>
            <span>{redemptionResult.message}</span>
          </div>
        )}
      </div>

      {/* Save Action Footer */}
      <div className="flex justify-end pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
        >
          <span>{saving ? '⏳' : '💾'}</span>
          <span>{saving ? 'Saving...' : 'Save License Info'}</span>
        </button>
      </div>
    </div>
  );
}
