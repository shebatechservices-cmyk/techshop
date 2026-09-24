import React from 'react';
import { taka } from '../hooks/usePurchaseCart';

export default function PurchaseSupplierSidebar({
  selectedSupplierObj,
  supplierPayable = 0,
  summary,
  handleOpenRecentPreview,
}) {
  return (
    <aside className="border border-slate-200 rounded-xl p-4.5 bg-white flex flex-col gap-3.5 h-fit">
      {selectedSupplierObj ? (
        <>
          {/* Avatar & Supplier Basic Info */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-slate-100 border-[1.5px] border-slate-300 flex items-center justify-center text-slate-600 text-xl shrink-0">
              👤
            </div>
            <div className="overflow-hidden">
              <div className="font-extrabold text-[0.98rem] text-slate-900 truncate">
                {selectedSupplierObj.name || 'Vendor / Supplier'}
              </div>
              <div className="text-xs text-slate-500">
                Code: {selectedSupplierObj.contact_code || `SUP-${selectedSupplierObj.id || ''}`}
              </div>
            </div>
          </div>

          <div className="text-sm text-slate-700 flex items-center gap-1.5">
            <span>📞</span>
            <span className="font-semibold">{selectedSupplierObj.phone || '-'}</span>
          </div>

          <div className="h-px bg-slate-100 my-0.5" />

          {/* Account Status: Outstanding Dues / Advance */}
          <div>
            <div className="text-[0.7rem] font-bold text-slate-400 tracking-wider uppercase mb-2">
              Account Status
            </div>

            {/* Outstanding Dues / Advance */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 flex items-center gap-1">
                <span>📑</span> {supplierPayable < 0 ? 'Advance Credit:' : 'Outstanding Dues:'}
              </span>
              {supplierPayable > 0 ? (
                <strong className="text-rose-600 font-bold bg-rose-50 py-0.5 px-2 rounded-md border border-rose-100">
                  {taka(supplierPayable)}
                </strong>
              ) : supplierPayable < 0 ? (
                <strong className="text-emerald-600 font-bold bg-emerald-50 py-0.5 px-2 rounded-md border border-emerald-200">
                  Advance: {taka(Math.abs(supplierPayable))}
                </strong>
              ) : (
                <strong className="text-emerald-600 font-bold bg-emerald-50 py-0.5 px-2 rounded-md border border-emerald-200">
                  ✓ No Dues
                </strong>
              )}
            </div>
          </div>

          <div className="h-px bg-slate-100 my-0.5" />

          {/* Recent Purchases List with Preview Popup Click */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="text-[0.7rem] font-bold text-slate-400 tracking-wider uppercase">
                Recent Purchases
              </div>
              <span className="text-[0.72rem] text-blue-500 font-semibold">Click to preview</span>
            </div>

            <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto">
              {summary?.recent_purchases && summary.recent_purchases.length > 0 ? (
                summary.recent_purchases.map((recent) => (
                  <div
                    key={recent.id}
                    onClick={() => handleOpenRecentPreview && handleOpenRecentPreview(recent)}
                    className="border border-slate-200 rounded-lg py-2 px-2.5 flex justify-between items-center bg-slate-50 cursor-pointer hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-150"
                    title="Click to view voucher ledger, open in purchase form, print, or share"
                  >
                    <div>
                      <div className="font-bold text-[0.82rem] text-slate-900">
                        {recent.po_number}
                      </div>
                      <div className="text-[0.72rem] text-slate-500">
                        {new Date(recent.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: '2-digit',
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <strong className="text-[0.84rem] text-sky-600">
                        {taka(recent.total_cost)}
                      </strong>
                      <div
                        className={`text-[0.68rem] font-semibold ${
                          Number(recent.total_due) > 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {Number(recent.total_due) > 0
                          ? `Due: ${taka(recent.total_due)}`
                          : 'Paid'}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 italic text-center p-3">
                  No recent purchases recorded
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-slate-100 my-0.5" />

          {/* Recent Payments */}
          <div>
            <div className="text-[0.7rem] font-bold text-slate-400 tracking-wider uppercase mb-1.5">
              Recent Payments
            </div>
            {summary?.recent_payments && summary.recent_payments.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {summary.recent_payments.slice(0, 3).map((pmt) => (
                  <div key={pmt.id} className="flex justify-between text-xs">
                    <span className="text-slate-600">
                      {pmt.payment_method} (
                      {new Date(pmt.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                      })}
                      )
                    </span>
                    <strong className="text-emerald-600">{taka(pmt.amount)}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">
                No recent payments recorded
              </div>
            )}
          </div>
        </>
      ) : null}
    </aside>
  );
}
