import React from 'react';

export default function A4TopProductsAndSignatures({ topProducts = [] }) {
  return (
    <>
      {/* Top 5 Revenue Generating Products */}
      {topProducts.length > 0 && (
        <div className="mb-7">
          <h4 className="text-xs font-bold text-slate-900 uppercase mb-2">
            🏆 Top Revenue Generating Products (In Selected Period)
          </h4>
          <table className="w-full border-collapse text-xs border border-slate-200">
            <thead>
              <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 font-bold">
                <th className="py-1.5 px-2.5 text-left">Product / SKU</th>
                <th className="py-1.5 px-2.5 text-center">Units Sold</th>
                <th className="py-1.5 px-2.5 text-right">Revenue (৳)</th>
                <th className="py-1.5 px-2.5 text-right">Estimated COGS (৳)</th>
                <th className="py-1.5 px-2.5 text-right">Gross Profit (৳)</th>
                <th className="py-1.5 px-2.5 text-right">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topProducts.slice(0, 5).map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-1.5 px-2.5 font-semibold text-slate-800">
                    {item.product_name}{' '}
                    <span className="text-slate-400 font-normal">({item.sku})</span>
                  </td>
                  <td className="py-1.5 px-2.5 text-center text-slate-700">{item.units_sold}</td>
                  <td className="py-1.5 px-2.5 text-right font-semibold text-slate-900">
                    ৳ {item.revenue_generated?.toLocaleString('en-IN')}
                  </td>
                  <td className="py-1.5 px-2.5 text-right text-slate-500">
                    ৳ {Number(item.total_cost || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-1.5 px-2.5 text-right font-bold text-emerald-600">
                    ৳ {item.profit?.toLocaleString('en-IN')}
                  </td>
                  <td className="py-1.5 px-2.5 text-right font-semibold text-slate-700">
                    {item.margin_pct}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Audit Signatures */}
      <div className="mt-12 flex justify-between pt-2">
        <div className="text-center w-44">
          <div className="border-t border-slate-400 pt-1.5 text-xs font-semibold text-slate-700">
            Prepared By
          </div>
          <span className="text-[11px] text-slate-400">Accountant / Officer</span>
        </div>
        <div className="text-center w-44">
          <div className="border-t border-slate-400 pt-1.5 text-xs font-semibold text-slate-700">
            Verified By
          </div>
          <span className="text-[11px] text-slate-400">Internal Auditor</span>
        </div>
        <div className="text-center w-44">
          <div className="border-t border-slate-400 pt-1.5 text-xs font-bold text-slate-900">
            Approved By
          </div>
          <span className="text-[11px] text-slate-400">Managing Director</span>
        </div>
      </div>

      <div className="text-center mt-7 text-[11px] text-slate-400">
        * This statement is an officially generated computer record from Sheba ERP/POS financial engine.
      </div>
    </>
  );
}
