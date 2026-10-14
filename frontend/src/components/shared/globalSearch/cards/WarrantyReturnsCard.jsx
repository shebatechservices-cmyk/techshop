import React from 'react';

/**
 * Dimension 4: Warranty & Returns Status Card
 */
export default function WarrantyReturnsCard({
  warranty,
  product,
  isSold,
  serialCode,
  taka,
  onClose,
  onNavigate,
}) {
  return (
    <div className="bg-white rounded-xl border border-amber-100 shadow-xs p-4 flex flex-col justify-between hover:border-amber-300 transition">
      <div>
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-amber-50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg text-sm">🛡️</span>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
              4. Warranty &amp; Returns
            </h4>
          </div>
          {isSold ? (
            <span
              className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                warranty.is_customer_warranty_valid
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {warranty.is_customer_warranty_valid ? '✓ Warranty Valid' : '⚠️ Expired'}
            </span>
          ) : (
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              {warranty.warranty_months || product.warranty_months || 12} Months Policy
            </span>
          )}
        </div>

        <div className="space-y-2 text-xs">
          {isSold ? (
            <>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer Expiry:</span>
                <span className="font-bold text-slate-800">
                  {warranty.customer_warranty_expiry || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Days Remaining:</span>
                <span
                  className={`font-mono font-extrabold px-2 py-0.5 rounded ${
                    warranty.is_customer_warranty_valid
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {warranty.customer_days_remaining ?? 0} days remaining
                </span>
              </div>
              <div className="text-[11px] text-slate-500 italic">
                Includes +{warranty.grace_days || 60} days supplier grace allowance.
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-600">
              {warranty.customer_warranty_info || 'Available in stock. Warranty starts when customer invoice is issued.'}
            </div>
          )}

          {/* Claims or Returns list */}
          {warranty.claims && warranty.claims.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-600 block mb-1">Service Claims:</span>
              {warranty.claims.map((wc, i) => (
                <div key={i} className="text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded mb-1">
                  Claim #{wc.claim_no} ({wc.status}): {wc.issue_description || 'In service'}
                </div>
              ))}
            </div>
          )}

          {warranty.returns && warranty.returns.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-600 block mb-1">Returns / Refunds:</span>
              {warranty.returns.map((ret, i) => (
                <div key={i} className="text-[11px] text-rose-800 bg-rose-50 p-1.5 rounded mb-1">
                  Return #{ret.return_no}: {ret.return_qty} pcs ({taka(ret.refund_amount)})
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {onNavigate && (
        <button
          type="button"
          onClick={() => {
            onClose();
            onNavigate({ section: 'warranty', search: serialCode || product.name });
          }}
          className="mt-3 w-full py-1.5 text-center text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition"
        >
          Open Warranty &amp; RMA Services →
        </button>
      )}
    </div>
  );
}
