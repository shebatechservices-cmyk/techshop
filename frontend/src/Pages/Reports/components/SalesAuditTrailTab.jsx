import React from 'react';

export default function SalesAuditTrailTab({
  filteredAudit = [],
  auditSearch,
  setAuditSearch,
  statusFilter,
  setStatusFilter,
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Search & Filter Bar */}
      <div className="p-3.5 sm:p-4 border-b border-slate-200 flex justify-between items-center flex-wrap gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2.5 flex-1 min-w-[260px]">
          <div className="relative w-full max-w-sm">
            <input
              type="text"
              placeholder="Search by Invoice #, Customer Name, or Phone..."
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              className="w-full pl-3 pr-8 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
            />
            {auditSearch && (
              <button
                type="button"
                onClick={() => setAuditSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-500 font-semibold mr-1">Status:</span>
          {['all', 'paid', 'partial', 'due'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                statusFilter === st
                  ? 'border border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                  : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider text-[11px] font-semibold">
              <th className="py-2.5 px-3 text-left">#</th>
              <th className="py-2.5 px-3 text-left">Invoice #</th>
              <th className="py-2.5 px-3 text-left">Date & Time</th>
              <th className="py-2.5 px-3 text-left">Customer</th>
              <th className="py-2.5 px-3 text-right">Total (৳)</th>
              <th className="py-2.5 px-3 text-right">Discount</th>
              <th className="py-2.5 px-3 text-right">Paid (৳)</th>
              <th className="py-2.5 px-3 text-right">Due (৳)</th>
              <th className="py-2.5 px-3 text-right">COGS (৳)</th>
              <th className="py-2.5 px-3 text-right">Gross Profit</th>
              <th className="py-2.5 px-3 text-right">Margin %</th>
              <th className="py-2.5 px-3 text-left">Payment Method</th>
              <th className="py-2.5 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAudit.length === 0 ? (
              <tr>
                <td colSpan="13" className="text-center py-10 text-slate-400 font-medium">
                  No sales transactions match the criteria.
                </td>
              </tr>
            ) : (
              filteredAudit.map((row, idx) => {
                const total = parseFloat(row.total_amount || 0);
                const cogs = parseFloat(row.estimated_cogs || 0);
                const profit = total - cogs;
                const margin = total > 0 ? ((profit / total) * 100).toFixed(1) : 0;
                const d = new Date(row.created_at);
                const dateFormatted = isNaN(d)
                  ? ''
                  : d.toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                return (
                  <tr key={row.id || idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{row.invoice_no}</td>
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{dateFormatted}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-slate-800">{row.customer_name}</span>
                      {row.customer_phone && (
                        <span className="text-slate-400 text-[11px] block">{row.customer_phone}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      ৳ {total.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-right text-rose-600 font-medium">
                      ৳ {parseFloat(row.discount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 font-semibold">
                      ৳ {parseFloat(row.paid_amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-medium ${
                        parseFloat(row.due_amount || 0) > 0 ? 'text-amber-600' : 'text-slate-500'
                      }`}
                    >
                      ৳ {parseFloat(row.due_amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500">
                      ৳ {cogs.toLocaleString('en-IN')}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-bold ${
                        profit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      ৳ {profit.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-700">
                      {margin}%
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-medium">
                      {row.payment_method || 'Cash'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide ${
                          row.payment_status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : row.payment_status === 'partial'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {row.payment_status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
