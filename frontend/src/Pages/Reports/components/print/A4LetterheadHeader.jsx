import React from 'react';

export default function A4LetterheadHeader({ shop, printDateStr, periodLabel, filterDates }) {
  return (
    <>
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">
            {shop.shop_name || 'Seba Technology & Networking'}
          </h1>
          <p className="text-xs text-slate-600 font-medium mb-1">
            {shop.shop_title || 'Professional CCTV & Network Solution'}
          </p>
          <p className="text-xs text-slate-500">
            📍 {shop.address || 'Aruail South Market, Sarail'} &nbsp;|&nbsp; 📞 {shop.phone || '01800000000'}
          </p>
        </div>
        <div className="text-right">
          <div className="inline-block bg-slate-100 border border-slate-300 px-2.5 py-1 rounded text-[11px] font-bold text-slate-800 uppercase tracking-wider">
            Official Financial Statement
          </div>
          <div className="mt-1.5 text-xs text-slate-500">
            Generated: <strong className="text-slate-700">{printDateStr}</strong>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Period: <strong className="text-slate-900">{periodLabel}</strong> ({filterDates.from} to {filterDates.to})
          </div>
        </div>
      </div>

      <div className="text-center mb-5">
        <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-wide mb-1">
          Statement of Comprehensive Income (Profit &amp; Loss)
        </h2>
        <span className="text-xs text-slate-500">
          Reporting Currency: Bangladeshi Taka (BDT ৳)
        </span>
      </div>
    </>
  );
}
