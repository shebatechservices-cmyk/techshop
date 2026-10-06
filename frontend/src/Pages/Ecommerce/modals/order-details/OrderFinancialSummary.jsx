import React from 'react';

const money = (val) => Number.parseFloat(val || 0) || 0;
const taka = (val) => `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function OrderFinancialSummary({
  itemsSubtotal,
  deliveryCharge,
  grandTotal,
  onDeleteOrder,
}) {
  return (
    <div className="flex flex-wrap justify-between items-center gap-3">
      <button
        type="button"
        onClick={onDeleteOrder}
        className="text-red-500 hover:text-red-600 text-xs font-semibold cursor-pointer transition-colors"
      >
        🗑️ Delete Order
      </button>

      <div className="w-full sm:w-[280px] bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Subtotal:</span>
          <span className="font-semibold text-slate-900">{taka(itemsSubtotal)}</span>
        </div>
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>Delivery Charge:</span>
          <span className="font-semibold text-slate-900">{taka(deliveryCharge)}</span>
        </div>
        <div className="border-t border-slate-200 pt-1.5 flex justify-between text-sm font-extrabold text-slate-900">
          <span>Grand Total:</span>
          <span className="text-teal-600">{taka(grandTotal)}</span>
        </div>
      </div>
    </div>
  );
}
