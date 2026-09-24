import React from 'react';

export default function LanguageLocaleTab({
  settings,
  setSettings,
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
            <span className="text-blue-600 font-bold">Language & Locale</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>🗣️</span> Language & Localization Preferences
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure system UI language, number format grouping (Lakh/Crore vs Millions), and calendar date displays.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
        >
          <span>{saving ? '⏳' : '💾'}</span>
          <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            Default Application Language
          </label>
          <select
            value={settings.app_language || 'en'}
            onChange={(e) => setSettings({ ...settings, app_language: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="en">🇺🇸 English (Default International)</option>
            <option value="bn">🇧🇩 Bengali / বাংলা</option>
          </select>
          <p className="text-[11px] text-slate-500">
            Controls the primary interface navigation, buttons, and alert messages.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            Financial Number Grouping
          </label>
          <select
            value={settings.number_format || 'lakh'}
            onChange={(e) => setSettings({ ...settings, number_format: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="lakh">৳ 1,25,000.00 (South Asian Lakh & Crore)</option>
            <option value="million">৳ 125,000.00 (Western Thousands & Millions)</option>
          </select>
          <p className="text-[11px] text-slate-500">
            Applies to accounting reports, sales totals, invoice receipts, and currency displays.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            Date Presentation Format
          </label>
          <select
            defaultValue="DD/MM/YYYY"
            className="w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 22/09/2026)</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-09-22)</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 09/22/2026)</option>
          </select>
          <p className="text-[11px] text-slate-500">
            Formatted on printed receipts, ledger timestamps, and audit transaction tables.
          </p>
        </div>
      </div>
    </div>
  );
}
