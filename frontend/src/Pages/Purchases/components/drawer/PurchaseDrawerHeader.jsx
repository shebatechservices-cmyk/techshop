import React from 'react';

export default function PurchaseDrawerHeader({ order, statusBadge, onClose, onPrint, onEdit }) {
  return (
    <>
      <div className="p-4 sm:px-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xl">🛒</span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-800 tracking-tight">
                {order?.po_number || `PO-${order?.id}`}
              </h2>
              <span
                className={`text-[0.68rem] font-bold px-2 py-0.5 rounded-full border uppercase ${statusBadge.bg}`}
              >
                {statusBadge.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {order?.created_at
                ? new Date(order.created_at).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Recent Purchase Order'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          title="Close drawer (Esc)"
        >
          ✕
        </button>
      </div>

      <div className="px-5 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {onPrint && (
            <button
              type="button"
              onClick={() => onPrint(order)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-md text-xs font-bold hover:bg-sky-100 transition-colors"
            >
              <span>🖨️</span> Print Voucher
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(order)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-xs font-bold hover:bg-amber-100 transition-colors"
            >
              <span>✏️</span> Edit Order
            </button>
          )}
        </div>

        <span className="text-[0.7rem] text-slate-400">Quick View</span>
      </div>
    </>
  );
}
