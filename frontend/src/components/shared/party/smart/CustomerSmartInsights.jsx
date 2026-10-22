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
    : 'No recent orders';

  return (
    <div className="bg-gradient-to-br from-indigo-50/50 via-white to-sky-50/50 border border-indigo-100 rounded-2xl p-4 mb-5 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm">🧠</span>
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            Smart Customer Insights
          </h4>
        </div>
        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${badge_color}`}>
          {trust_label}
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3.5">
        <div className="bg-white/80 backdrop-blur-sm border border-indigo-50 p-2.5 rounded-xl">
          <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">
            Avg Order Value (AOV)
          </span>
          <span className="text-sm font-extrabold text-indigo-700">
            ৳ {Number(aov).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border border-indigo-50 p-2.5 rounded-xl">
          <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">
            Visit / Buying Frequency
          </span>
          <span className="text-xs font-bold text-slate-700">
            {frequency_days ? `~ Every ${frequency_days} days` : 'Periodic Buyer'}
          </span>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border border-indigo-50 p-2.5 rounded-xl">
          <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">
            Last Order Date
          </span>
          <span className="text-xs font-bold text-slate-700">
            {formattedLastOrder}
          </span>
        </div>
      </div>

      {/* Top Purchased Products */}
      {top_products.length > 0 && (
        <div>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">
            ⭐ Top Purchased Products
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {top_products.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200/80 rounded-lg p-2 flex items-center justify-between text-xs"
              >
                <div className="truncate mr-2">
                  <span className="font-semibold text-slate-800 block truncate">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ৳ {Number(item.total_spent).toLocaleString('en-BD')} spent
                  </span>
                </div>
                <span className="bg-indigo-50 text-indigo-700 text-[11px] font-bold px-2 py-0.5 rounded-md flex-shrink-0">
                  {item.total_qty} units
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
