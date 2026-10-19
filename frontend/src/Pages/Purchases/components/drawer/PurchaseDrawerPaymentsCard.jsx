import React from 'react';

export default function PurchaseDrawerPaymentsCard({ payments, taka }) {
  if (!Array.isArray(payments) || payments.length === 0) return null;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
      <div className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider">
        Payment Records ({payments.length})
      </div>
      <div className="divide-y divide-slate-200/80">
        {payments.map((p, pIdx) => (
          <div key={p.id || pIdx} className="py-1.5 flex justify-between items-center">
            <div>
              <span className="font-bold text-slate-800">
                {p.account_name || p.payment_method || 'Payment'}
              </span>
              {p.transaction_id && (
                <span className="text-[0.68rem] text-slate-500 font-mono ml-1.5">
                  ({p.transaction_id})
                </span>
              )}
            </div>
            <span className="font-bold text-emerald-700">{taka(p.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
