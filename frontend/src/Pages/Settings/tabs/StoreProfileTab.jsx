import React from 'react';
import BDPhoneInput from '../../../components/shared/BDPhoneInput';

export default function StoreProfileTab({
  settings,
  setSettings,
  saving,
  handleResetDummyShop,
  handleSaveSettings,
  handleLogoUpload
}) {
  return (
    <div className="space-y-5">
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

      {/* Strict 3-Column Responsive CSS Grid Form Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. Shop / Vendor Code */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
            <span>Shop / Vendor Code</span>
            <span className="text-blue-600 font-black">*</span>
          </label>
          <input
            type="text"
            value={settings.shop_code || ''}
            onChange={(e) => setSettings({ ...settings, shop_code: e.target.value })}
            placeholder="e.g. SHB-001 or VEND-101"
            className="w-full h-10 border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-mono"
          />
        </div>

        {/* 2. Shop / Company Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
            <span>Shop / Company Name</span>
            <span className="text-rose-500 font-bold">*</span>
          </label>
          <input
            type="text"
            value={settings.shop_name || ''}
            onChange={(e) => setSettings({ ...settings, shop_name: e.target.value })}
            placeholder="e.g. Sheba Technology & Networking"
            className="w-full h-10 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
        </div>

        {/* 3. Branch / Outlet Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Branch / Outlet Name
          </label>
          <input
            type="text"
            value={settings.branch_name || ''}
            onChange={(e) => setSettings({ ...settings, branch_name: e.target.value })}
            placeholder="e.g. Main Branch - Head Office"
            className="w-full h-10 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
        </div>

        {/* 4. Tagline / Business Subtitle */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Tagline / Business Subtitle
          </label>
          <input
            type="text"
            value={settings.shop_title || ''}
            onChange={(e) => setSettings({ ...settings, shop_title: e.target.value })}
            placeholder="e.g. CCTV, IT & Networking Solution"
            className="w-full h-10 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
        </div>

        {/* 5. Primary Phone Number */}
        <div className="flex flex-col gap-1.5">
          <BDPhoneInput
            label="Primary Phone Number"
            required
            value={settings.phone || ''}
            onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
            placeholder="1X-XXXXXXXX"
          />
        </div>

        {/* 6. Alternate Phone / Hotline */}
        <div className="flex flex-col gap-1.5">
          <BDPhoneInput
            label="Alternate Phone / Hotline"
            value={settings.alt_phone || ''}
            onChange={(e) => setSettings({ ...settings, alt_phone: e.target.value })}
            placeholder="1X-XXXXXXXX"
          />
        </div>

        {/* 7. Official Email Address */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Official Email Address
          </label>
          <input
            type="email"
            value={settings.email || ''}
            onChange={(e) => setSettings({ ...settings, email: e.target.value })}
            placeholder="e.g. info@shebatech.com.bd"
            className="w-full h-10 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
        </div>

        {/* 8. Website URL */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Website URL
          </label>
          <input
            type="url"
            value={settings.website || ''}
            onChange={(e) => setSettings({ ...settings, website: e.target.value })}
            placeholder="e.g. https://shebatech.com.bd"
            className="w-full h-10 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
        </div>

        {/* 9. Currency Symbol */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Currency Symbol
          </label>
          <select
            value={settings.currency_symbol || '৳'}
            onChange={(e) => setSettings({ ...settings, currency_symbol: e.target.value })}
            className="w-full h-10 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          >
            <option value="৳">৳ BDT (Bangladeshi Taka)</option>
            <option value="$">$ USD (United States Dollar)</option>
            <option value="€">€ EUR (Euro)</option>
            <option value="£">£ GBP (British Pound)</option>
            <option value="₹">₹ INR (Indian Rupee)</option>
            <option value="AED">AED (UAE Dirham)</option>
            <option value="SAR">SAR (Saudi Riyal)</option>
          </select>
        </div>

        {/* 10. Trade License Number */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Trade License Number
          </label>
          <input
            type="text"
            value={settings.trade_license || ''}
            onChange={(e) => setSettings({ ...settings, trade_license: e.target.value })}
            placeholder="e.g. TRAD/DNCC/048219/2024"
            className="w-full h-10 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
        </div>

        {/* 11. BIN / VAT / TIN Registration Number */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            BIN / VAT / TIN Number
          </label>
          <input
            type="text"
            value={settings.bin_tin || ''}
            onChange={(e) => setSettings({ ...settings, bin_tin: e.target.value })}
            placeholder="e.g. BIN-003948172-0101"
            className="w-full h-10 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
        </div>

        {/* 12. Store Timezone */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Store Timezone
          </label>
          <input
            type="text"
            value={settings.timezone || 'Asia/Dhaka'}
            onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
            placeholder="e.g. Asia/Dhaka"
            className="w-full h-10 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
        </div>

        {/* 13. Full Store Physical Address (Spans full width) */}
        <div className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-3">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
            <span>Full Store Physical Address</span>
            <span className="text-rose-500 font-bold">*</span>
          </label>
          <textarea
            rows={2}
            value={settings.address || ''}
            onChange={(e) => setSettings({ ...settings, address: e.target.value })}
            placeholder="Shop #, Market/Building Name, Road #, Area, City, Postal Code"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all resize-none"
          />
        </div>

        {/* 14. Logo Uploader Refactor (Spans full width) */}
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
      </div>
    </div>
  );
}
