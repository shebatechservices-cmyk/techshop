import React from 'react';

export default function CustomerSmartInsights({ smart = {}, profile = {} }) {
  const {
    trust_label = 'Standard Client',
    badge_color = 'bg-slate-100 text-slate-800',
    aov = 0,
    frequency_days = null,
    top_products = [],
    last_order_date,
  } = smart;

  const formattedLastOrder = last_order_date
    ? new Date(last_order_date).toLocaleDateString('en-BD', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'None';

  return (
    <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-2.5 shadow-2xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between flex-wrap gap-1.5 mb-2">
          <span className="text-[11px] font-black text-indigo-900 uppercase tracking-wide flex items-center gap-1">
            <span>🧠</span> Customer Insights
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge_color}`}>
            {trust_label}
          </span>
        </div>

        {/* Micro Metrics Row */}
        <div className="grid grid-cols-3 gap-1.5 text-[11px]">
          <div className="bg-white border border-indigo-50 p-1.5 px-2 rounded-lg">
            <span className="text-[9px] text-slate-400 font-bold uppercase block">Avg Order</span>
            <span className="font-extrabold text-indigo-700">
              ৳ {Number(aov).toLocaleString('en-BD', { minimumFractionDigits: 0 })}
            </span>
          </div>

          <div className="bg-white border border-indigo-50 p-1.5 px-2 rounded-lg">
            <span className="text-[9px] text-slate-400 font-bold uppercase block">Frequency</span>
            <span className="font-bold text-slate-700">
              {frequency_days ? `~${frequency_days}d` : 'Periodic'}
            </span>
          </div>

          <div className="bg-white border border-indigo-50 p-1.5 px-2 rounded-lg">
            <span className="text-[9px] text-slate-400 font-bold uppercase block">Last Order</span>
            <span className="font-bold text-slate-700 truncate block">
              {formattedLastOrder}
            </span>
          </div>
        </div>
      </div>

      {/* Compact Top Purchased Products */}
      {top_products.length > 0 && (
        <div className="pt-1 border-t border-indigo-100/60">
          <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
            ⭐ Top Purchased Items
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
            {top_products.map((item) => (
              <div
                key={item.name}
                className="bg-white border border-slate-200/80 rounded-lg p-1.5 px-2 flex justify-between items-center"
              >
                <div className="truncate mr-1.5">
                  <span className="font-semibold text-slate-800 block truncate" title={item.name}>
                    {item.name}
                  </span>
                  <span className="text-[9px] text-slate-400 block">
                    ৳{Number(item.total_spent).toLocaleString('en-BD')}
                  </span>
                </div>
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0">
                  {item.total_qty} pcs
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
