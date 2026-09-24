import React from 'react';

export default function LandscapeAuditPrint({
  shop = {},
  pnl = {},
  auditList = [],
  printDateStr = '',
  periodLabel = '',
  filterDates = { from: '', to: '' },
}) {
  return (
    <div className="text-slate-900 text-xs leading-normal">
      {/* Header */}
      <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3 mb-3.5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-0.5">
            {shop.shop_name || 'Seba Technology & Networking'}
          </h2>
          <p className="text-xs text-slate-500">
            📍 {shop.address || 'Aruail South Market, Sarail'} &nbsp;|&nbsp; 📞 {shop.phone || '01800000000'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-base font-extrabold text-blue-900 uppercase tracking-wide">
            Sales Audit & Item Profit Register
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Period: <strong className="text-slate-800">{periodLabel}</strong> ({filterDates.from} to {filterDates.to}) &nbsp;|&nbsp; Generated: {printDateStr}
          </div>
        </div>
      </div>

      {/* Audit Table */}
      <table className="w-full border-collapse text-[11px] mb-4">
        <thead>
          <tr className="bg-slate-900 text-white">
            <th className="py-1.5 px-2 text-left">#</th>
            <th className="py-1.5 px-2 text-left">Invoice #</th>
            <th className="py-1.5 px-2 text-left">Date & Time</th>
            <th className="py-1.5 px-2 text-left">Customer</th>
            <th className="py-1.5 px-2 text-right">Total (৳)</th>
            <th className="py-1.5 px-2 text-right">Discount</th>
            <th className="py-1.5 px-2 text-right">Paid (৳)</th>
            <th className="py-1.5 px-2 text-right">Due (৳)</th>
            <th className="py-1.5 px-2 text-right">COGS (৳)</th>
            <th className="py-1.5 px-2 text-right">Gross Profit</th>
            <th className="py-1.5 px-2 text-right">Margin %</th>
            <th className="py-1.5 px-2 text-left">Payment Method</th>
            <th className="py-1.5 px-2 text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          {auditList.length === 0 ? (
            <tr>
              <td colSpan="13" className="text-center py-6 text-slate-400">
                No sales transactions recorded in this period.
              </td>
            </tr>
          ) : (
            auditList.map((row, idx) => {
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

              const status = (row.payment_status || '').toLowerCase();

              return (
                <tr
                  key={row.id || idx}
                  className={`border-b border-slate-200 ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                  }`}
                >
                  <td className="py-1.5 px-2 text-slate-500">{idx + 1}</td>
                  <td className="py-1.5 px-2 font-bold text-slate-900">{row.invoice_no}</td>
                  <td className="py-1.5 px-2 text-slate-600 whitespace-nowrap">{dateFormatted}</td>
                  <td className="py-1.5 px-2">
                    <strong className="text-slate-800">{row.customer_name}</strong>
                    {row.customer_phone && (
                      <span className="text-slate-500 text-[10px]"> ({row.customer_phone})</span>
                    )}
                  </td>
                  <td className="py-1.5 px-2 text-right font-bold text-slate-900">
                    ৳ {total.toLocaleString('en-IN')}
                  </td>
                  <td className="py-1.5 px-2 text-right text-red-600">
                    ৳ {parseFloat(row.discount || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-1.5 px-2 text-right font-semibold text-emerald-600">
                    ৳ {parseFloat(row.paid_amount || 0).toLocaleString('en-IN')}
                  </td>
                  <td
                    className={`py-1.5 px-2 text-right ${
                      parseFloat(row.due_amount || 0) > 0 ? 'text-amber-600 font-bold' : 'text-slate-500'
                    }`}
                  >
                    ৳ {parseFloat(row.due_amount || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-1.5 px-2 text-right text-slate-500">
                    ৳ {cogs.toLocaleString('en-IN')}
                  </td>
                  <td
                    className={`py-1.5 px-2 text-right font-bold ${
                      profit >= 0 ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    ৳ {profit.toLocaleString('en-IN')}
                  </td>
                  <td className="py-1.5 px-2 text-right font-semibold text-slate-700">{margin}%</td>
                  <td className="py-1.5 px-2 text-slate-600">{row.payment_method || 'Cash'}</td>
                  <td className="py-1.5 px-2 text-center">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : status === 'partial'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
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

        {/* Summary Totals Row */}
        <tfoot>
          <tr className="bg-slate-100 font-extrabold border-y-2 border-slate-900 text-[11px]">
            <td colSpan="4" className="py-2 px-2 text-right text-slate-800">
              TOTAL SUMMARY ({auditList.length} Invoices):
            </td>
            <td className="py-2 px-2 text-right text-slate-900">
              ৳ {pnl.gross_revenue?.toLocaleString('en-IN') || 0}
            </td>
            <td className="py-2 px-2 text-right text-red-600">
              ৳ {pnl.total_discounts?.toLocaleString('en-IN') || 0}
            </td>
            <td className="py-2 px-2 text-right text-emerald-600">
              ৳ {pnl.total_collected?.toLocaleString('en-IN') || 0}
            </td>
            <td className="py-2 px-2 text-right text-amber-600">
              ৳ {pnl.total_due_given?.toLocaleString('en-IN') || 0}
            </td>
            <td className="py-2 px-2 text-right text-red-700">
              ৳ {pnl.cogs?.toLocaleString('en-IN') || 0}
            </td>
            <td className="py-2 px-2 text-right text-emerald-700">
              ৳ {pnl.gross_profit?.toLocaleString('en-IN') || 0}
            </td>
            <td className="py-2 px-2 text-right text-slate-800">
              {pnl.gross_margin_pct}%
            </td>
            <td colSpan="2"></td>
          </tr>
        </tfoot>
      </table>

      {/* Landscape Signatures */}
      <div className="flex justify-between mt-7">
        <div className="text-center w-52">
          <div className="border-t border-slate-400 pt-1 text-xs font-semibold text-slate-700">
            Audited & Prepared By
          </div>
        </div>
        <div className="text-center w-52">
          <div className="border-t border-slate-400 pt-1 text-xs font-bold text-slate-900">
            Authorizing Officer
          </div>
        </div>
      </div>
    </div>
  );
}
