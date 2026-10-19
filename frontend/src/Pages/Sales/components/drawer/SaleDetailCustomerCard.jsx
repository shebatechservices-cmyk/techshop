import React from 'react';

export default function SaleDetailCustomerCard({ sale, taka, onCollectDue }) {
  const hasReceivable = sale?.customer_receivable_balance !== undefined;
  const balanceNum = Number(sale?.customer_receivable_balance || 0);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
      <div className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider">
        Customer Information
      </div>
      <div className="flex justify-between items-start gap-2">
        <div>
          <div className="font-bold text-slate-800 text-sm">
            {sale?.customer_name || 'Walk-in Customer'}
          </div>
          {sale?.customer_phone && (
            <div className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
              <span>📞</span> {sale.customer_phone}
            </div>
          )}
          {sale?.customer_address && (
            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <span>📍</span> {sale.customer_address}
            </div>
          )}
        </div>

        {hasReceivable && (
          <div className="text-right">
            <span className="text-[0.68rem] text-slate-500 block">Total Due</span>
            <span className="text-xs font-extrabold text-rose-600 block">
              {taka(sale.customer_receivable_balance)}
            </span>
            {onCollectDue && balanceNum > 0 && (
              <button
                type="button"
                onClick={() => onCollectDue(sale)}
                className="inline-block mt-0.5 text-[10px] font-bold text-sky-600 hover:text-sky-800 hover:underline cursor-pointer"
              >
                Collect Due
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
