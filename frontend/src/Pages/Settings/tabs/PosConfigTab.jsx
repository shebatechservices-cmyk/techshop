import React from 'react';

export default function PosConfigTab({
  settings,
  setSettings,
  saving,
  handleSaveSettings
}) {
  return (
    <div className="space-y-5">
      {/* Sub-page Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <span>Settings</span>
            <span>/</span>
            <span className="text-blue-600 font-bold">POS & System</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>⚙️</span> POS Terminal & System Preferences
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure barcode scanner behaviors, audio indicators, zero-stock safeguards, and UI display preferences.
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
            <span>{saving ? 'Saving...' : 'Save POS Preferences'}</span>
          </button>
        </div>
      </div>

      {/* Grid of Preference Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Barcode Scanner Instant Add */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>🔍</span> Barcode Scanner Instant Add
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Immediately append scanned products directly to the active sale cart without requiring manual Enter or clicking.
              </p>
            </div>
            <input
              type="checkbox"
              checked={!!settings.barcode_scanner_auto_submit}
              onChange={(e) => setSettings({ ...settings, barcode_scanner_auto_submit: e.target.checked })}
              className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer mt-0.5"
            />
          </div>
        </div>

        {/* Audio & Beep Effects */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>🔔</span> Audio & POS Beep Effects
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Play sound notifications upon barcode scan, payment completion, cash drawer opening, or input errors.
              </p>
            </div>
            <input
              type="checkbox"
              checked={!!settings.sound_effects_enabled}
              onChange={(e) => setSettings({ ...settings, sound_effects_enabled: e.target.checked })}
              className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer mt-0.5"
            />
          </div>
        </div>

        {/* Zero Stock Prevention */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>🛑</span> Strict Stock Lock (Prevent Negative Sales)
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Block invoice checkout if any line item has zero or insufficient inventory stock.
              </p>
            </div>
            <input
              type="checkbox"
              checked={!settings.negative_stock_allowed}
              onChange={(e) => setSettings({ ...settings, negative_stock_allowed: !e.target.checked })}
              className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer mt-0.5"
            />
          </div>
        </div>

        {/* Customer Loyalty Points */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>🎁</span> Customer Loyalty Program
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Automatically calculate and reward customer loyalty credit points upon successful invoice completion.
              </p>
            </div>
            <input
              type="checkbox"
              checked={!!settings.loyalty_enabled}
              onChange={(e) => setSettings({ ...settings, loyalty_enabled: e.target.checked })}
              className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer mt-0.5"
            />
          </div>
        </div>

        {/* Low Stock Warning Threshold */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:border-slate-300 transition-colors">
          <label className="text-sm font-bold text-slate-900 block mb-1">
            ⚠️ Low Stock Alert Threshold
          </label>
          <p className="text-xs text-slate-500 mb-3 leading-relaxed">
            Trigger dashboard warning badges and re-order reminders when inventory quantity reaches this limit.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              max="500"
              value={settings.low_stock_threshold || 5}
              onChange={(e) => setSettings({ ...settings, low_stock_threshold: parseInt(e.target.value, 10) || 5 })}
              className="w-24 px-3 py-1.5 border border-slate-300 rounded-md text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center gap-1.5">
              {[3, 5, 10, 20].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSettings({ ...settings, low_stock_threshold: val })}
                  className={`px-2.5 py-1 text-xs font-semibold rounded border transition-colors ${
                    settings.low_stock_threshold === val
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {val} Pcs
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Theme Preference */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:border-slate-300 transition-colors">
          <label className="text-sm font-bold text-slate-900 block mb-1">
            🎨 Application Theme Mode
          </label>
          <p className="text-xs text-slate-500 mb-3 leading-relaxed">
            Choose light contrast or dark enterprise styling for dashboard and POS terminal layouts.
          </p>
          <select
            value={settings.theme_mode || 'light'}
            onChange={(e) => setSettings({ ...settings, theme_mode: e.target.value })}
            className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="light">☀️ Clean White / Light Mode</option>
            <option value="dark">🌙 Dark Slate Enterprise Mode</option>
            <option value="system">🖥️ System Default Auto Match</option>
          </select>
        </div>
      </div>
    </div>
  );
}
