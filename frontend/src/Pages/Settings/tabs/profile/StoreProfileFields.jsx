import React from 'react';
import BangladeshiPhoneInput from '../../../../components/ui/BangladeshiPhoneInput';

export default function StoreProfileFields({ settings, setSettings }) {
  return (
    <>
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
        <BangladeshiPhoneInput
          label="Primary Phone Number"
          required
          value={settings.phone || ''}
          onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
          placeholder="1X-XXXXXXXX"
        />
      </div>

      {/* 6. Alternate Phone / Hotline */}
      <div className="flex flex-col gap-1.5">
        <BangladeshiPhoneInput
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
    </>
  );
}
