import React from 'react';

export default function WarrantyExpiringAlerts({
  expireData,
  expireLoading,
  showExpiredList,
  setShowExpiredList,
  refreshExpiry,
}) {
  if (!expireData && !expireLoading) return null;

  const summary = expireData?.summary || { expired_count: 0, expiring_count: 0, active_count: 0 };
  const items = expireData?.items || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs mb-4">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xl">📈</span>
          <div>
            <h4 className="text-xs font-extrabold text-slate-900">
              Warranty Expiry Radar (+60 days grace)
            </h4>
            <p className="text-[11px] text-slate-500">
              Live best-warranty tracker across all sold serial-tracked merchandise
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Expired pill */}
          <div
            onClick={() => setShowExpiredList(!showExpiredList)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition cursor-pointer ${
              summary.expired_count > 0
                ? 'bg-red-50 border-red-200 text-red-800 hover:bg-red-100'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
            title="Click to toggle list"
          >
            <span className="text-sm">⚠️</span>
            <div>
              <span className="text-[9px] uppercase font-bold text-red-900/70 block">Expired</span>
              <span className="text-sm font-extrabold text-red-700 leading-none">
                {summary.expired_count}
              </span>
            </div>
          </div>

          {/* Expiring Soon pill */}
          <div
            onClick={() => setShowExpiredList(!showExpiredList)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition cursor-pointer ${
              summary.expiring_count > 0
                ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
            title="Click to toggle list"
          >
            <span className="text-sm">⏳</span>
            <div>
              <span className="text-[9px] uppercase font-bold text-amber-900/70 block">Expiring &lt;60d</span>
              <span className="text-sm font-extrabold text-amber-700 leading-none">
                {summary.expiring_count}
              </span>
            </div>
          </div>

          {/* Refresh button */}
          <button
            type="button"
            onClick={refreshExpiry}
            disabled={expireLoading}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs transition cursor-pointer"
            title="Refresh warranty status"
          >
            <span className={expireLoading ? 'animate-spin inline-block' : ''}>🔄</span>
          </button>
        </div>
      </div>

      {/* Collapsible Expiring Items Table */}
      {showExpiredList && items.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-2 px-3">Product / Serial</th>
                <th className="py-2 px-3">Customer</th>
                <th className="py-2 px-3">Invoice</th>
                <th className="py-2 px-3">Warranty Period</th>
                <th className="py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70">
                  <td className="py-2 px-3">
                    <div className="font-semibold text-slate-800">{item.product_name}</div>
                    <div className="font-mono text-[11px] text-slate-500">S/N: {item.serial_code}</div>
                  </td>
                  <td className="py-2 px-3 text-slate-700">
                    <div>{item.customer_name}</div>
                    <div className="text-[11px] text-slate-500">{item.customer_phone}</div>
                  </td>
                  <td className="py-2 px-3 text-slate-600">{item.invoice_no || 'N/A'}</td>
                  <td className="py-2 px-3 text-slate-600">
                    <div>{item.expiry_date}</div>
                    <div className="text-[10px] text-slate-400">{item.days_left} days left</div>
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.is_expired
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.is_expired ? 'Expired' : 'Expiring Soon'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
