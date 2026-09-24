import React from 'react';

export default function WarrantyReturnsTab({
  returns = [],
  handleOpenEditReturn,
  setReturnToDelete,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/70 text-slate-600 border-b border-slate-200 font-bold uppercase text-[10px] tracking-wider">
              <th className="py-3 px-3.5">Return #</th>
              <th className="py-3 px-3.5">Invoice #</th>
              <th className="py-3 px-3.5">Product & S/N</th>
              <th className="py-3 px-3.5">Customer</th>
              <th className="py-3 px-3.5">Type</th>
              <th className="py-3 px-3.5">Condition / Restock</th>
              <th className="py-3 px-3.5">Refund Amount</th>
              <th className="py-3 px-3.5">Reason</th>
              <th className="py-3 px-3.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {returns.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-slate-400">
                  No product returns recorded yet.
                </td>
              </tr>
            ) : (
              returns.map((r, idx) => (
                <tr key={r.id || idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3.5 font-mono font-bold text-purple-700">
                    {r.return_no}
                  </td>
                  <td className="py-3 px-3.5 text-slate-600 font-mono">
                    {r.invoice_no || 'N/A'}
                  </td>
                  <td className="py-3 px-3.5">
                    <strong className="text-slate-900">{r.product_name}</strong>
                    {r.serial_code && (
                      <div className="font-mono text-[11px] text-slate-500">
                        S/N: {r.serial_code}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="text-slate-800">{r.customer_name}</div>
                    <div className="text-slate-500 text-[11px]">{r.customer_phone}</div>
                  </td>
                  <td className="py-3 px-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        r.return_type === 'Exchange'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {r.return_type}
                    </span>
                  </td>
                  <td className="py-3 px-3.5">
                    {r.condition === 'Good' ? (
                      <span className="text-[11px] font-bold text-emerald-700">
                        ✓ Good (Restocked)
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-red-600">
                        ⚠️ Damaged (Quarantine)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3.5 font-bold text-slate-900">
                    {r.refund_amount > 0 ? `৳ ${r.refund_amount}` : '৳ 0 (Exchange)'}
                  </td>
                  <td className="py-3 px-3.5 text-slate-600 max-w-xs truncate" title={r.return_reason}>
                    {r.return_reason}
                  </td>
                  <td className="py-3 px-3.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditReturn(r)}
                        className="px-2 py-1 rounded-md border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition cursor-pointer"
                        title="Edit Return Record"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setReturnToDelete(r)}
                        className="px-2 py-1 rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold transition cursor-pointer"
                        title="Delete Return Record"
                      >
                        🗑️
                      </button>
                    </div>
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
