import React from 'react';

const taka = (v) => `৳ ${Number(v || 0).toLocaleString('en-BD', { minimumFractionDigits: 0 })}`;

export default function MobilePocketRecentSales({
  recentSales,
  onSelectSale,
  onViewAllSales,
}) {
  return (
    <div className="px-4 pt-4 pb-20">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 m-0">
          সাম্প্রতিক বিক্রি
        </h3>
        <button
          type="button"
          onClick={onViewAllSales}
          className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline"
        >
          সব বিক্রি ➔
        </button>
      </div>

      {recentSales.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          আজকে এখনো কোনো বিক্রয় সম্পন্ন হয়নি
        </div>
      ) : (
        <div className="space-y-2">
          {recentSales.map((sale) => {
            const due = Math.max(0, Number(sale.payable_amount || sale.final_amount || 0) - Number(sale.paid_amount || 0));
            const isFullyPaid = due <= 0;

            return (
              <button
                key={sale.id}
                type="button"
                onClick={() => onSelectSale(sale)}
                className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-sm hover:border-sky-300 active:scale-98 transition-all text-left"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-1.5">
                    <strong className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate block">
                      {sale.customer_name || 'নগদ খদ্দের'}
                    </strong>
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md ${
                        isFullyPaid
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                      }`}
                    >
                      {isFullyPaid ? 'পেইড' : 'বাকি'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {sale.invoice_no || `INV-${sale.id}`} •{' '}
                    {sale.created_at ? new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>

                <div className="text-right">
                  <strong className="text-xs font-black text-slate-800 dark:text-slate-100 block">
                    {taka(sale.payable_amount || sale.final_amount)}
                  </strong>
                  <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold">
                    রিসিট 🧾
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
