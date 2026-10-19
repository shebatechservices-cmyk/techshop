import React from 'react';

export default function StoreTaxLegalFields({ settings, setSettings }) {
  return (
    <>
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
    </>
  );
}
