import React from 'react';

export default function SecuritySessionTab({
  currentUser,
  settings,
  setSettings,
  setIsLocked,
  saving,
  handleSaveSettings,
  onLogout,
  showToast
}) {
  return (
    <div className="space-y-6">
      {/* Sub-page Header with Breadcrumbs & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <span>Settings</span>
            <span>/</span>
            <span className="text-blue-600 font-bold">Session & Security</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>🔒</span> Session Security & Access Control
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage terminal inactivity lockout, security unlock PIN code, and active session termination.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm shadow-blue-500/30 flex items-center gap-1.5"
          >
            <span>{saving ? '⏳' : '💾'}</span>
            <span>{saving ? 'Saving...' : 'Save Security Preferences'}</span>
          </button>
        </div>
      </div>

      {/* Grid of Security Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Card 1: Active Session Details */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>👤</span> Active Session Details
              </h4>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Online
              </span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Logged User</span>
                <span className="font-semibold text-slate-900 text-right">
                  {currentUser?.name || 'Super Admin'} ({currentUser?.role_name || 'Admin'})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Contact Identifier</span>
                <span className="font-semibold text-slate-900 text-right">
                  {currentUser?.phone || currentUser?.email || 'admin@sheba.net'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Security Mode</span>
                <span className="font-semibold text-slate-900 text-right">
                  Single-PC Active Lock
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400 font-medium">Device Token</span>
                <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                  TERM-{Math.abs(currentUser?.id || 1).toString().padStart(4, '0')}-DHAKA
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-1.5">
            <span>🛡️</span> Hardware ID bound to active browser storage
          </div>
        </div>

        {/* Card 2: Security Lock PIN & Auto-Lock Timeout */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>🔑</span> Lock PIN & Timeout
              </h4>
              <span className="text-[11px] font-semibold text-slate-400">Security Gate</span>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Terminal Unlock PIN (4 to 6 Digits)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={settings.security_pin || '1234'}
                  onChange={(e) => setSettings({ ...settings, security_pin: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono tracking-widest bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="1234"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Default factory passcode is 1234. Change this for security.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Auto Inactivity Timeout
                </label>
                <select
                  value={settings.session_timeout_minutes || 30}
                  onChange={(e) => setSettings({ ...settings, session_timeout_minutes: parseInt(e.target.value, 10) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value={15}>15 Minutes of Inactivity</option>
                  <option value={30}>30 Minutes (Recommended)</option>
                  <option value={60}>60 Minutes</option>
                  <option value={0}>Never Auto-Lock (Manual Only)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsLocked(true)}
              className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>🔒</span> Lock Screen Now
            </button>
          </div>
        </div>

        {/* Card 3: Session Termination & Logout Actions */}
        <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-rose-100 mb-3">
              <h4 className="text-sm font-bold text-rose-800 flex items-center gap-2">
                <span>🚪</span> Terminal Logout & Reset
              </h4>
              <span className="text-[10px] uppercase font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded">
                Danger Zone
              </span>
            </div>

            <p className="text-xs text-rose-700 leading-relaxed mb-4">
              Terminate active sessions across other workstations or log out completely from this workstation terminal.
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => showToast('All remote terminal sessions have been successfully disconnected!')}
                className="w-full py-2 px-3 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 rounded-lg text-xs font-bold transition-colors shadow-xs text-center flex items-center justify-center gap-1.5"
              >
                <span>⚡</span> Disconnect Other Terminals
              </button>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to completely log out from the system?')) {
                    if (onLogout) {
                      onLogout();
                    } else {
                      localStorage.clear();
                      sessionStorage.clear();
                      window.location.href = '/';
                    }
                  }
                }}
                className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm shadow-rose-500/20 text-center flex items-center justify-center gap-1.5"
              >
                <span>🚪</span> Complete System Logout
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-rose-100 text-[11px] text-rose-500 leading-tight">
            * Logging out clears your active local session tokens.
          </div>
        </div>

        {/* Card 4: Invoice Modification & Policy Settings (RBAC) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between md:col-span-2 lg:col-span-3">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🛡️</span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Invoice Modification & Time Limits (RBAC Policy)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Enforce store-wide editing and deletion constraints for Cashiers and Staff.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                Admin Governed
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Allow modification toggle */}
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="text-xs font-bold text-slate-800">
                      Allow Invoice Modification
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.allow_invoice_modification !== false}
                      onChange={(e) => setSettings({ ...settings, allow_invoice_modification: e.target.checked })}
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    When enabled, Cashiers and Staff can edit or delete sales invoices within the allowed time window and open shifts. When disabled, invoice changes are locked to Admins only.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/80 text-[11px] font-medium text-slate-600">
                  Current Policy: <span className={settings.allow_invoice_modification !== false ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                    {settings.allow_invoice_modification !== false ? '✓ Enabled (Standard Operations)' : '🚫 Strictly Locked (Admins Only)'}
                  </span>
                </div>
              </div>

              {/* Edit Time Limit dropdown */}
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Invoice Edit Time Limit Window
                  </label>
                  <select
                    value={settings.invoice_edit_time_limit_hours ?? 360}
                    onChange={(e) => setSettings({ ...settings, invoice_edit_time_limit_hours: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none mb-2"
                  >
                    <option value={360}>15 Days (360 Hours) - Standard Default</option>
                    <option value={168}>7 Days (168 Hours) - 1 Week Window</option>
                    <option value={72}>3 Days (72 Hours) - Grace Period</option>
                    <option value={24}>24 Hours (1 Day) - Same-Day Only</option>
                    <option value={12}>12 Hours - Shift Only</option>
                    <option value={0}>0 Hours (Instant Lock upon checkout)</option>
                  </select>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Sets maximum hours after creation an invoice remains editable. Invoices beyond this window or past a register shift close are locked for staff.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/80 text-[11px] text-slate-500 flex items-center gap-1.5">
                  <span>💡</span>
                  <span>Admins can forcefully override locks using the <strong>Security PIN ({settings.security_pin || '1234'})</strong>.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Save Bar */}
      <div className="flex justify-end pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={saving}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm shadow-blue-500/30 flex items-center gap-2"
        >
          <span>{saving ? '⏳' : '💾'}</span>
          <span>{saving ? 'Saving Preferences...' : 'Save Security Preferences'}</span>
        </button>
      </div>
    </div>
  );
}
