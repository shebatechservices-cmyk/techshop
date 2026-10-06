import React from 'react';

const money = (val) => Number.parseFloat(val || 0) || 0;
const taka = (val) => `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function OrderItemsTable({ items = [] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-4 shadow-xs">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
        <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wide">
          Ordered Products ({items.length})
        </span>
      </div>

      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase">
            <th className="px-3 py-2 text-left">PRODUCT</th>
            <th className="px-3 py-2 text-center w-20">QTY</th>
            <th className="px-3 py-2 text-right w-28">UNIT PRICE</th>
            <th className="px-3 py-2 text-right w-28">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => {
            const lineTotal = money(it.quantity) * money(it.unit_price);
            const displayName = it.full_name || it.name || it.product_name || `Product ID #${it.product_id}`;
            return (
              <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="px-3 py-2.5">
                  <div className="font-semibold text-slate-900">
                    {displayName}
                  </div>
                  {it.sku && <div className="text-[11px] text-slate-500 mt-0.5">SKU: {it.sku}</div>}
                </td>
                <td className="px-3 py-2.5 text-center font-bold">{it.quantity}</td>
                <td className="px-3 py-2.5 text-right text-slate-700">{taka(it.unit_price)}</td>
                <td className="px-3 py-2.5 text-right font-bold text-slate-900">{taka(lineTotal)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
