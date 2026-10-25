import React from 'react';

const taka = (v) => `৳ ${Number(v || 0).toLocaleString('en-BD', { minimumFractionDigits: 0 })}`;

export default function MobilePocketRecentSales({
  recentSales,
  onSelectSale,
  onViewAllSales,
}) {
  return (
    <div className="px-4 pt-4 pb-24">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">🧾</span>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 m-0">
            সাম্প্রতিক বিক্রি ও ইনভয়েস
          </h3>
        </div>
        <button
          type="button"
          onClick={onViewAllSales}
          className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
        >
          <span>সকল বিক্রি</span>
          <span>➔</span>
        </button>
      </div>

      {recentSales.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-4">
          <p className="m-0 text-slate-400">আজকে এখনো কোনো বিক্রয় সম্পন্ন হয়নি</p>
          <span className="text-[10px] text-slate-500 mt-1 block">নিচে "শপ" বাটন চেপে নতুন বিক্রি শুরু করুন</span>
        </div>
      ) : (
        <div className="space-y-2.5">
          {recentSales.map((sale) => {
            const due = Math.max(0, Number(sale.payable_amount || sale.final_amount || 0) - Number(sale.paid_amount || 0));
            const isFullyPaid = due <= 0;

            return (
              <button
                key={sale.id}
                type="button"
                onClick={() => onSelectSale(sale)}
                className="w-full flex items-center justify-between p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-sm hover:border-emerald-400 active:scale-[0.98] transition-all text-left group"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <div className="flex items-center gap-2">
                    <strong className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate block">
                      {sale.customer_name || 'নগদ খদ্দের'}
                    </strong>
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                        isFullyPaid
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                      }`}
                    >
                      {isFullyPaid ? 'পেইড' : 'বাকি'}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-400 block mt-1">
                    {sale.invoice_no || `INV-${sale.id}`} •{' '}
                    {sale.created_at ? new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <strong className="text-sm font-black text-slate-900 dark:text-white block leading-tight">
                    {taka(sale.payable_amount || sale.final_amount)}
                  </strong>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <span>ভিউ / প্রিন্ট</span>
                    <span>🧾</span>
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
