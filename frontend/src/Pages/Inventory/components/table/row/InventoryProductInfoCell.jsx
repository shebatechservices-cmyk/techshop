import React from 'react';

export default function InventoryProductInfoCell({ product: p, onViewProductDetails }) {
  return (
    <td className="py-1 px-2.5 align-middle">
      <div className="flex flex-col gap-px">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onViewProductDetails) onViewProductDetails(p);
          }}
          className="text-left font-bold text-slate-900 text-xs leading-snug cursor-pointer hover:text-sky-600 hover:underline transition-colors bg-transparent border-0 p-0 m-0 group/title inline-flex items-center gap-1"
          title="Click to view product details"
        >
          <span>{p.composite_name || p.name}</span>
          <span className="text-[11px] text-sky-500 opacity-60 group-hover/title:opacity-100 group-hover/title:translate-x-0.5 transition-all">↗</span>
        </button>

        <div className="flex items-center gap-1.5 flex-wrap mt-px">
          {/* SKU / Barcode Pill */}
          <span
            className="font-mono text-[0.66rem] font-bold text-sky-600 bg-sky-50 border border-sky-200 py-px px-1 rounded whitespace-nowrap cursor-pointer hover:bg-sky-100 transition-colors"
            title={`SKU / Barcode: ${p.sku || p.barcode || 'N/A'} (Click to view)`}
            onClick={() => onViewProductDetails && onViewProductDetails(p)}
          >
            {p.sku || p.barcode || `PRD-${p.id}`}
          </span>

          {/* Category / Sub-category Breadcrumb */}
          {(p.category_name || p.sub_category_name) && (
            <span
              className="text-[0.66rem] text-slate-500 bg-slate-50 border border-slate-200 py-px px-1.5 rounded whitespace-nowrap"
              title="Category"
            >
              {p.category_name || 'General'}
              {p.sub_category_name ? ` › ${p.sub_category_name}` : ''}
            </span>
          )}
        </div>
      </div>
    </td>
  );
}
