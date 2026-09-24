import React from 'react';

export default function TopProductsTab({ topProducts = [] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>🏆</span> Top Revenue & Margin Generating Products
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Ranked by units delivered and gross profitability contribution
          </p>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
          {topProducts.length} Items Ranked
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/70 text-slate-600 border-b border-slate-200 font-bold uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4">Rank</th>
              <th className="py-3 px-4">Product Name & SKU</th>
              <th className="py-3 px-4 text-center">Units Sold</th>
              <th className="py-3 px-4 text-right">Revenue (৳)</th>
              <th className="py-3 px-4 text-right">Est. COGS (৳)</th>
              <th className="py-3 px-4 text-right">Gross Profit (৳)</th>
              <th className="py-3 px-4 text-right">Margin %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {topProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  No sales data found for the selected period.
                </td>
              </tr>
            ) : (
              topProducts.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        idx === 0
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : idx === 1
                          ? 'bg-slate-200 text-slate-700'
                          : idx === 2
                          ? 'bg-amber-50 text-amber-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{item.product_name}</div>
                    <div className="font-mono text-[11px] text-slate-400">{item.sku}</div>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-slate-700">
                    {item.units_sold} pcs
                  </td>
                  <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                    ৳ {item.revenue_generated?.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-500">
                    ৳ {Number(item.total_cost || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right font-extrabold text-emerald-600">
                    ৳ {item.profit?.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full">
                      {item.margin_pct}%
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
