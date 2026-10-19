import React from 'react';

export default function InventoryStockCell({
  product: p,
  stock,
  isOut,
  isLow,
  warehouseName
}) {
  return (
    <td className="py-1 px-2 text-center align-middle">
      <div className="inline-flex flex-col items-center gap-px">
        <span
          className={`inline-flex items-center gap-1 py-px px-1.5 rounded font-extrabold text-xs whitespace-nowrap border ${
            isOut
              ? 'bg-red-50 text-red-600 border-red-200'
              : isLow
              ? 'bg-orange-50 text-orange-600 border-orange-200'
              : 'bg-emerald-50 text-emerald-600 border-emerald-200'
          }`}
          title={`Available in ${warehouseName}`}
        >
          <span>{isOut ? '🚫' : isLow ? '⚠️' : '✓'}</span>
          <span>{p.stock_display || `${stock} ${p.unit_name || 'pcs'}`}</span>
        </span>
        <span
          className="text-[0.62rem] text-slate-400 font-semibold whitespace-nowrap"
          title="Total recorded inflow"
        >
          Inflow: {p.total_inflow_units || p.purchase_count || stock} {p.unit_name || 'pcs'}
        </span>
      </div>
    </td>
  );
}
