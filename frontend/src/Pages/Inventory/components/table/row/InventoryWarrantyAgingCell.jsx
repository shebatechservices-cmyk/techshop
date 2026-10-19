import React from 'react';

export default function InventoryWarrantyAgingCell({
  product: p,
  agingDays,
  isAged60Plus,
  expDateStr,
  validity,
  handleOpenWarrantyModal
}) {
  return (
    <>
      {/* Inventory Aging */}
      <td className="py-1 px-1.5 text-center align-middle">
        {isAged60Plus ? (
          <span
            className="inline-flex items-center gap-0.5 py-px px-1 rounded bg-red-50 border border-red-300 text-red-600 text-[0.7rem] font-extrabold whitespace-nowrap"
            title={`Batch purchased on ${p.purchase_date || 'N/A'}. Aging: ${agingDays} days (Aged 60+ days)`}
          >
            <span>⚠️</span>
            <span>{agingDays}d</span>
          </span>
        ) : (
          <span
            className="text-[0.72rem] text-slate-500 font-semibold whitespace-nowrap"
            title={p.purchase_date ? `Purchased: ${p.purchase_date}` : ''}
          >
            {agingDays > 0 ? `${agingDays}d` : p.purchase_date ? 'Today' : '—'}
          </span>
        )}
      </td>

      {/* Supplier Warranty Expiry */}
      <td className="py-1 px-2 text-center align-middle">
        {expDateStr ? (
          <div className="inline-flex flex-col items-center gap-px">
            <button
              type="button"
              onClick={() => handleOpenWarrantyModal(p)}
              className={`inline-flex items-center gap-1 py-px px-1.5 rounded text-[0.7rem] font-bold cursor-pointer whitespace-nowrap border transition-colors ${
                isAged60Plus
                  ? 'bg-red-50 border-red-300 text-red-600'
                  : 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100'
              }`}
              title={`Supplier Expiry: ${expDateStr}. Click to view warranty serials`}
            >
              <span>🛡️</span>
              <span>
                {new Date(expDateStr).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: '2-digit',
                })}
              </span>
            </button>
            {validity && (
              <span
                className={`px-1 rounded text-[0.6rem] font-bold whitespace-nowrap ${
                  isAged60Plus ? 'bg-red-100 text-red-600' : validity.colorClass
                }`}
              >
                {validity.text}
              </span>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => handleOpenWarrantyModal(p)}
            className="inline-flex items-center gap-1 py-px px-1.5 bg-slate-50 border border-slate-200 rounded text-slate-500 hover:text-slate-700 text-[0.7rem] font-semibold cursor-pointer transition-colors"
            title="View serials & warranty"
          >
            <span>🛡️</span>
            <span>{p.warranty_months ? `${p.warranty_months}m` : '—'}</span>
          </button>
        )}
      </td>
    </>
  );
}
