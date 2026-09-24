import React from 'react';
import { taka } from '../hooks/useNewSale';

export default function SaleCustomerSidebar({
  selectedCustomer,
  customerTypeRaw,
  isGroupCustomer,
  isGroupDiscountActive,
  previousDue,
  customerWalletBalance,
  customerSummary,
  loadingSummary,
  handleToggleGroupDiscount,
  handlePreviewRecentSale,
}) {
  return (
    <aside className="bg-white border-r border-slate-200 p-3.5 sm:px-3.5 sm:py-4 overflow-y-auto">
      <h4 className="m-0 mb-2 text-sm font-bold text-slate-900">
        Customer Details
      </h4>
      {selectedCustomer ? (
        <div className="text-xs text-slate-700">
          <div className="font-bold text-sm text-slate-900 mb-0.5">
            {selectedCustomer.name}
          </div>
          <div className="text-slate-500 mb-0.5 text-xs">📞 {selectedCustomer.phone || 'N/A'}</div>
          {selectedCustomer.email && (
            <div className="text-slate-500 mb-0.5 text-xs">✉️ {selectedCustomer.email}</div>
          )}
          {selectedCustomer.address && (
            <div className="text-slate-500 mb-1 text-xs">📍 {selectedCustomer.address}</div>
          )}

          <div className="mt-2.5 p-2 bg-slate-50 rounded-md border border-slate-200">
            <div className="flex justify-between mb-0.5 text-[0.74rem]">
              <span className="text-slate-500">Customer Group:</span>
              <strong className={isGroupCustomer ? 'text-emerald-600' : 'text-slate-900'}>{customerTypeRaw}</strong>
            </div>
            <div className="flex justify-between mb-0.5 text-[0.74rem]">
              <span className="text-slate-500">Previous Due:</span>
              <strong className={previousDue > 0 ? 'text-rose-600' : 'text-emerald-600'}>{taka(previousDue)}</strong>
            </div>
            <div className="flex justify-between text-[0.74rem]">
              <span className="text-slate-500">Wallet / Advance:</span>
              <strong className="text-sky-600">{taka(customerWalletBalance)}</strong>
            </div>
          </div>

          {isGroupCustomer && (
            <div className="mt-2">
              <button
                type="button"
                onClick={handleToggleGroupDiscount}
                className={`w-full py-1.5 px-2 rounded border border-emerald-300 text-emerald-700 text-xs font-bold cursor-pointer transition-colors ${
                  isGroupDiscountActive ? 'bg-emerald-100' : 'bg-white hover:bg-emerald-50'
                }`}
              >
                {isGroupDiscountActive ? '✓ 5% Group Discount Applied' : '+ Apply 5% Group Discount'}
              </button>
            </div>
          )}

          <div className="h-px bg-slate-200 my-3" />

          {/* Recent Sales Invoices List */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="text-xs font-bold text-slate-500 tracking-wider uppercase">
                🧾 Recent Invoices
              </div>
              {customerSummary?.recent_sales && customerSummary.recent_sales.length > 0 && (
                <span className="text-[0.68rem] text-sky-600 font-semibold">Click to preview</span>
              )}
            </div>

            {loadingSummary ? (
              <div className="text-xs text-slate-500 text-center p-3 bg-slate-50 rounded-md border border-slate-200">
                ⏳ Loading history...
              </div>
            ) : customerSummary?.recent_sales && customerSummary.recent_sales.length > 0 ? (
              <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto">
                {customerSummary.recent_sales.map((sale) => {
                  const dueAmount = Number(sale.due_amount || 0);
                  return (
                    <div
                      key={sale.id}
                      onClick={() => handlePreviewRecentSale(sale)}
                      className="border border-slate-200 hover:border-emerald-300 rounded-md p-1.5 flex justify-between items-center bg-slate-50 hover:bg-emerald-50/60 cursor-pointer transition-all"
                      title="Click to preview & print invoice"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-slate-900 truncate">
                          {sale.invoice_no || `INV-${sale.id}`}
                        </div>
                        <div className="text-[0.68rem] text-slate-500">
                          {sale.created_at ? new Date(sale.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                        </div>
                      </div>
                      <div className="text-right ml-1.5">
                        <strong className="text-xs text-sky-600">{taka(sale.total_amount)}</strong>
                        <div className={`text-[0.66rem] font-bold ${dueAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {dueAmount > 0 ? `Due: ${taka(dueAmount)}` : '✓ Paid'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic text-center p-2.5 bg-slate-50 rounded-md border border-dashed border-slate-200">
                No previous sales recorded
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-400 m-0 leading-relaxed">
          Select a customer to view contact details, group privileges, and outstanding ledger balance.
        </p>
      )}
    </aside>
  );
}
