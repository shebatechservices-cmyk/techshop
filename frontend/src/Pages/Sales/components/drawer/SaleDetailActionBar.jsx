import React from 'react';

export default function SaleDetailActionBar({ sale, due, onPrint, onEdit, onCollectDue }) {
  const hasReceivable = Number(sale?.customer_receivable_balance || 0) > 0;
  const canCollectDue = onCollectDue && (due > 0 || hasReceivable);

  return (
    <div className="px-5 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        {onPrint && (
          <button
            type="button"
            onClick={() => onPrint(sale)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-md text-xs font-bold hover:bg-sky-100 transition-colors cursor-pointer"
          >
            <span>🖨️</span> Print Invoice
          </button>
        )}

        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(sale)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-xs font-bold hover:bg-amber-100 transition-colors cursor-pointer"
          >
            <span>✏️</span> Edit Sale
          </button>
        )}

        {canCollectDue && (
          <button
            type="button"
            onClick={() => onCollectDue(sale)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-md text-xs font-bold hover:bg-emerald-100 transition-colors shadow-sm cursor-pointer"
          >
            <span>💳</span> Collect Due
          </button>
        )}
      </div>

      <span className="text-[0.7rem] text-slate-400">Quick View</span>
    </div>
  );
}
