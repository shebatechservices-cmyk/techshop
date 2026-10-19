import React from 'react';

export default function SaleDetailHeader({ sale, statusBadge, onClose }) {
  return (
    <div className="p-4 sm:px-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="text-xl">🧾</span>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-800 tracking-tight">
              {sale?.invoice_no || `INV-${sale?.id}`}
            </h2>
            <span
              className={`text-[0.68rem] font-bold px-2 py-0.5 rounded-full border uppercase ${statusBadge.bg}`}
            >
              {statusBadge.label}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {sale?.created_at
              ? new Date(sale.created_at).toLocaleString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Recent Sale'}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
        title="Close drawer (Esc)"
      >
        ✕
      </button>
    </div>
  );
}
