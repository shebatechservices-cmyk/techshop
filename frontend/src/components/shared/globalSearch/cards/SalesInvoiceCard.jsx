import React from 'react';

/**
 * Dimension 3: Sales Invoice Information Card
 */
export default function SalesInvoiceCard({ sale, taka, onClose, onNavigate }) {
  const hasInvoice = Boolean(sale?.invoice_no);

  return (
    <div className="bg-white rounded-xl border border-indigo-100 shadow-xs p-4 flex flex-col justify-between hover:border-indigo-300 transition">
      <div>
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-indigo-50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm">🛒</span>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
              3. Sales Invoice
            </h4>
          </div>
          {hasInvoice ? (
            <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
              {sale.invoice_no}
            </span>
          ) : (
            <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              Not Sold Yet
            </span>
          )}
        </div>

        {hasInvoice ? (
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Customer:</span>
              <span className="font-bold text-slate-800">{sale.customer_name || 'Customer'}</span>
            </div>
            {sale.customer_phone && sale.customer_phone !== 'N/A' && (
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="font-mono text-slate-700">{sale.customer_phone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Sale Date:</span>
              <span className="font-semibold text-slate-700">
                {sale.sale_date
                  ? new Date(sale.sale_date).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Invoice Date'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Invoiced Amount:</span>
              <span className="font-bold text-indigo-700">{taka(sale.unit_price)}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-100">
              <span className="text-slate-500">Payment Status:</span>
              <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                {sale.payment_status || 'Paid'}
              </span>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center text-slate-400 text-xs italic">
            This unit has not been sold yet. It remains in current stock.
          </div>
        )}
      </div>

      {hasInvoice && onNavigate && (
        <button
          type="button"
          onClick={() => {
            onClose();
            onNavigate({ section: 'sales', tab: 'history', search: sale.invoice_no });
          }}
          className="mt-3 w-full py-1.5 text-center text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
        >
          View Sales Invoice →
        </button>
      )}
    </div>
  );
}
