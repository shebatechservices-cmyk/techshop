import React from 'react';

const STATUS_BADGES = {
  delivered: 'bg-emerald-100 text-emerald-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  processing: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-red-100 text-red-700',
  pending: 'bg-slate-100 text-slate-700',
};

export default function OrderDetailsHeader({
  order,
  currentStatus,
  onOpenPrint,
  onClose,
}) {
  return (
    <div className="flex justify-between items-center px-6 py-4 bg-slate-900 text-white">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🛍️</span>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="m-0 text-lg font-extrabold">
              Order #{order.order_no || order.order_number || order.id}
            </h3>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-extrabold uppercase ${
                STATUS_BADGES[currentStatus] || STATUS_BADGES.pending
              }`}
            >
              {order.order_status || 'Pending'}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Placed on {order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onOpenPrint && onOpenPrint(order)}
          className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-colors"
        >
          🖨️ Print Slip
        </button>
        <button
          type="button"
          onClick={onClose}
          className="bg-white/10 hover:bg-white/20 text-white w-8 h-8 rounded-md cursor-pointer text-base flex items-center justify-center transition-colors"
          title="Close (Esc)"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
