import React from 'react';
import TableActionDropdown from '../../../../components/ui/TableActionDropdown';

export default function InventoryTableRow({
  product: p,
  isSelected,
  toggleSelectRow,
  warehouses,
  selectedWarehouseId,
  revealedCostIds,
  toggleCostVisibility,
  taka,
  getWarrantyValidity,
  handleOpenWarrantyModal,
  handleToggleEcommerce,
  onViewProductDetails,
  onOpenNewSale,
  handleOpenLabelModal,
  handleOpenTransferModal,
}) {
  const stock = Number(p.stock || 0);
  const minStock = Number(p.min_stock || 5);
  const isOut = stock <= 0;
  const isLow = stock <= minStock && !isOut;
  const agingDays = Number(p.aging_days || 0);
  const isAged60Plus = agingDays >= 60;

  // Compute Supplier Warranty Expiry Date
  let expDateStr = p.supplier_warranty_expire_date;
  const supMonths = Number(p.supplier_warranty_months || p.warranty_months || 0);
  if (!expDateStr && p.purchase_date && supMonths > 0) {
    const pd = new Date(p.purchase_date);
    if (!isNaN(pd.getTime())) {
      const exp = new Date(pd);
      exp.setMonth(exp.getMonth() + supMonths);
      expDateStr = exp.toISOString().split('T')[0];
    }
  }

  const validity = expDateStr && getWarrantyValidity ? getWarrantyValidity(expDateStr) : null;
  const warehouseName = warehouses?.find((w) => w.id === selectedWarehouseId)?.name || 'Warehouse';

  return (
    <tr
      key={p.id}
      onClick={(e) => {
        // Prevent opening modal if clicking interactive controls (checkbox, button, select, anchor)
        if (e.target.closest('button, input, select, a, [data-prevent-row-click="true"]')) {
          return;
        }
        if (onViewProductDetails) {
          onViewProductDetails(p);
        }
      }}
      className={`border-b border-slate-100 transition-colors cursor-pointer ${
        isSelected ? 'bg-sky-50' : 'bg-white hover:bg-sky-50/40'
      }`}
      title="Click row to view full product details"
    >
      {/* 1. Checkbox */}
      <td
        className="py-1 px-2 text-center align-middle"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleSelectRow(p.id)}
          className="cursor-pointer"
        />
      </td>

      {/* 2. Image Thumbnail */}
      <td className="py-1 px-1.5 text-center align-middle">
        <div
          onClick={() => onViewProductDetails && onViewProductDetails(p)}
          className="w-[30px] h-[30px] rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden mx-auto cursor-pointer hover:border-sky-400 hover:ring-2 hover:ring-sky-200 transition-all"
          title="Click to view full details"
        >
          {p.image_url ? (
            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm">📷</span>
          )}
        </div>
      </td>

      {/* 3. Product Info: Title + SKU + Category */}
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

      {/* 4. Stock & Record */}
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

      {/* 5. Pricing (Sale Price & Cost Price) */}
      <td className="py-1 px-2.5 text-right align-middle">
        <div className="flex flex-col items-end gap-px">
          <span className="font-extrabold text-slate-900 text-xs" title="Retail Selling Price">
            {taka(p.sale_price)}
            {p.conversion_rate > 1 && p.unit_name && (
              <span className="text-[0.65rem] font-normal text-slate-500"> /{p.unit_name}</span>
            )}
          </span>
          {p.conversion_rate > 1 && p.sub_unit_name && (
            <span className="text-[0.62rem] text-slate-500 font-medium leading-none">
              {taka(p.effective_sale_per_unit)}/{p.sub_unit_name}
            </span>
          )}
          <div className="inline-flex items-center gap-1 text-[0.66rem] text-slate-500">
            <span>Cost:</span>
            <span className="font-bold text-slate-600 font-mono">
              {revealedCostIds?.has(p.id) ? (
                <>
                  {taka(p.cost_price)}
                  {p.conversion_rate > 1 && p.sub_unit_name && (
                    <span className="font-sans font-normal text-[0.62rem] text-slate-500"> ({taka(p.effective_cost_per_unit)}/{p.sub_unit_name})</span>
                  )}
                </>
              ) : '৳••••'}
            </span>
            <button
              type="button"
              onClick={() => toggleCostVisibility(p.id)}
              className={`bg-transparent border-0 cursor-pointer px-0.5 inline-flex items-center leading-none ${
                revealedCostIds?.has(p.id) ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'
              }`}
              title={revealedCostIds?.has(p.id) ? 'Hide unit cost' : 'Show unit cost'}
              aria-label={revealedCostIds?.has(p.id) ? 'Hide cost' : 'Show cost'}
            >
              {revealedCostIds?.has(p.id) ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </td>

      {/* 6. Inventory Aging */}
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

      {/* 7. Supplier Warranty Expiry */}
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

      {/* 8. E-Commerce Interactive Toggle */}
      <td className="py-1 px-1.5 text-center align-middle">
        <button
          type="button"
          onClick={() => handleToggleEcommerce(p)}
          className={`py-0.5 px-1.5 rounded-full border-0 text-[0.66rem] font-bold cursor-pointer inline-flex items-center gap-1 transition-all ${
            p.is_ecommerce_active
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
          title="Click to toggle e-commerce visibility"
        >
          <span className="text-[0.62rem]">{p.is_ecommerce_active ? '🌐' : '🔒'}</span>
          <span>{p.is_ecommerce_active ? 'Live' : 'Off'}</span>
        </button>
      </td>

      {/* 9. Actions (Three-Dot Menu) */}
      <td className="py-1 px-2 text-center align-middle">
        <TableActionDropdown
          triggerLabel="⋮"
          triggerTitle="Actions"
          triggerClassName="border border-slate-300 rounded py-px px-1.5 font-bold text-sm text-slate-600 leading-none"
          items={[
            {
              key: 'view-details',
              label: 'View Details',
              icon: '👁️',
              className: 'text-slate-800 hover:bg-slate-100 font-semibold',
              onClick: () => {
                if (onViewProductDetails) {
                  onViewProductDetails(p);
                }
              },
            },
            {
              key: 'new-sale',
              label: 'New Sale',
              icon: '🛒',
              className: 'text-green-800 hover:bg-green-50',
              onClick: () => {
                if (onOpenNewSale) {
                  onOpenNewSale(p);
                }
              },
            },
            {
              key: 'print-labels',
              label: 'Print Labels',
              icon: '🏷️',
              onClick: () => handleOpenLabelModal(p),
            },
            {
              key: 'transfer-stock',
              label: 'Transfer Stock',
              icon: '🔄',
              className: 'text-sky-600 hover:bg-sky-50',
              onClick: () => handleOpenTransferModal(p),
            },
          ]}
        />
      </td>
    </tr>
  );
}
