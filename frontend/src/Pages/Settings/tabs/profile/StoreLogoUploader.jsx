import React from 'react';

export default function StoreLogoUploader({ settings, setSettings, saving, handleLogoUpload }) {
  return (
    <div className="flex flex-col gap-2 md:col-span-2 lg:col-span-3 pt-4 border-t border-slate-200">
      <div>
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Official Store Brand Logo
        </label>
        <p className="text-xs text-slate-500 mt-0.5">
          Used on cash memos, invoices, POS thermal printouts, and top headers.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4 mt-1">
        {/* Compact Thumbnail Box */}
        <div className="w-32 h-32 border border-slate-300 rounded-md p-1 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
          {settings.logo_url ? (
            <img
              src={settings.logo_url}
              alt="Shop Logo"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-center p-2 text-slate-400">
              <span className="text-2xl block mb-1">🏢</span>
              <span className="text-xs font-medium">No Logo</span>
            </div>
          )}
        </div>

        {/* Upload / Remove Actions */}
        <div className="flex flex-col gap-2">
          <label className="cursor-pointer">
            <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md text-xs font-bold transition-colors shadow-sm">
              <span>📤</span>
              <span>{settings.logo_url ? 'Change Logo' : 'Upload Logo'}</span>
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              disabled={saving}
              className="hidden"
            />
          </label>

          {settings.logo_url && (
            <button
              type="button"
              onClick={() => setSettings((prev) => ({ ...prev, logo_url: '' }))}
              className="px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-300 rounded-md transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>🗑️</span>
              <span>Remove Logo</span>
            </button>
          )}

          <span className="text-[11px] text-slate-400">
            Supports PNG, JPG, or WEBP (Max 2MB)
          </span>
        </div>
      </div>
    </div>
  );
}
