import React from 'react';

export default function PrintBrandingSection({ settings, setSettings, handleGenericImageUpload }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
        <span>🎨</span> Store Header & Watermark Branding
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Primary Shop Logo */}
        <div className="border border-slate-200 rounded-lg p-3 flex flex-col items-center text-center bg-slate-50/50">
          <span className="text-xs font-bold text-slate-700 mb-2">Primary Logo</span>
          <div className="w-full h-14 bg-white border border-slate-200 rounded flex items-center justify-center mb-2 overflow-hidden">
            {settings.logo_url ? (
              <img src={settings.logo_url} alt="Shop Logo" className="max-h-12 max-w-[90%] object-contain" />
            ) : (
              <span className="text-[11px] text-slate-400">No Logo</span>
            )}
          </div>
          <div className="flex gap-1.5 w-full">
            <label className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded cursor-pointer text-center transition-colors">
              Upload
              <input type="file" accept="image/*" onChange={(e) => handleGenericImageUpload(e, 'logo_url')} className="hidden" />
            </label>
            {settings.logo_url && (
              <button
                type="button"
                onClick={() => setSettings(prev => ({ ...prev, logo_url: '' }))}
                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold rounded transition-colors"
                title="Remove Logo"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Secondary / Sister Concern Logo */}
        <div className="border border-slate-200 rounded-lg p-3 flex flex-col items-center text-center bg-slate-50/50">
          <span className="text-xs font-bold text-slate-700 mb-2">Secondary Logo</span>
          <div className="w-full h-14 bg-white border border-slate-200 rounded flex items-center justify-center mb-2 overflow-hidden">
            {settings.secondary_logo_url ? (
              <img src={settings.secondary_logo_url} alt="Secondary Logo" className="max-h-12 max-w-[90%] object-contain" />
            ) : (
              <span className="text-[11px] text-slate-400">No Secondary</span>
            )}
          </div>
          <div className="flex gap-1.5 w-full">
            <label className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded cursor-pointer text-center transition-colors">
              Upload
              <input type="file" accept="image/*" onChange={(e) => handleGenericImageUpload(e, 'secondary_logo_url')} className="hidden" />
            </label>
            {settings.secondary_logo_url && (
              <button
                type="button"
                onClick={() => setSettings(prev => ({ ...prev, secondary_logo_url: '' }))}
                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold rounded transition-colors"
                title="Remove Secondary Logo"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Centered Watermark Logo */}
        <div className="border border-slate-200 rounded-lg p-3 flex flex-col items-center text-center bg-slate-50/50">
          <span className="text-xs font-bold text-slate-700 mb-2">Watermark Logo</span>
          <div className="w-full h-14 bg-white border border-slate-200 rounded flex items-center justify-center mb-2 overflow-hidden">
            {(settings.watermark_logo_url || settings.logo_url) ? (
              <img
                src={settings.watermark_logo_url || settings.logo_url}
                alt="Watermark Logo"
                className="max-h-12 max-w-[90%] object-contain"
                style={{ opacity: (Number(settings.watermark_opacity) || 6) / 20 }}
              />
            ) : (
              <span className="text-[11px] text-slate-400">Uses Main Logo</span>
            )}
          </div>
          <div className="flex gap-1.5 w-full">
            <label className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded cursor-pointer text-center transition-colors">
              Custom
              <input type="file" accept="image/*" onChange={(e) => handleGenericImageUpload(e, 'watermark_logo_url')} className="hidden" />
            </label>
            {settings.watermark_logo_url && (
              <button
                type="button"
                onClick={() => setSettings(prev => ({ ...prev, watermark_logo_url: '' }))}
                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold rounded transition-colors"
                title="Reset to default logo"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Subtitle & Watermark Opacity Controls */}
      <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Sister Concern / Header Subtitle
          </label>
          <input
            type="text"
            value={settings.sister_concern_name || ''}
            onChange={(e) => setSettings({ ...settings, sister_concern_name: e.target.value })}
            placeholder="e.g. A Sister Concern Of Sheba Group"
            className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <label className="flex items-center gap-1.5 text-xs text-slate-600 mt-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.show_sister_concern !== false}
              onChange={(e) => setSettings({ ...settings, show_sister_concern: e.target.checked })}
              className="rounded border-slate-300 text-blue-600"
            />
            Show Sister Concern on Invoice
          </label>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-bold text-slate-700">
              Watermark Opacity: {Number(settings.watermark_opacity) || 6}%
            </label>
            <label className="flex items-center gap-1 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enable_watermark !== false}
                onChange={(e) => setSettings({ ...settings, enable_watermark: e.target.checked })}
                className="rounded border-slate-300 text-blue-600"
              />
              Enabled
            </label>
          </div>
          <input
            type="range"
            min="3"
            max="15"
            step="1"
            value={Number(settings.watermark_opacity) || 6}
            onChange={(e) => setSettings({ ...settings, watermark_opacity: parseInt(e.target.value, 10) })}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
            <span>3% (Faint)</span>
            <span>6% (Optimal)</span>
            <span>15% (Bold)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
