import React from 'react';
import { isProductSerialTracked, isProductWarrantyRequired } from "../../../../utils/productUtils";
import TableActionDropdown from "../../../../components/ui/TableActionDropdown";

export default function ProductCatalogTableRow({
  product,
  isSelected,
  onToggleSelect,
  productLabel,
  handleEditProduct,
  deleteProduct,
  toggleProductStatus,
}) {
  const isSerialTracked = isProductSerialTracked(product);
  const isWarrantyReq = isProductWarrantyRequired(product);
  const isLowStock = Number(product.stock || 0) <= Number(product.min_stock || 0);

  return (
    <tr className="hover:bg-slate-50/70 transition-colors bg-white">
      <td className="py-3 px-3.5">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(product.id)}
          aria-label={`Select ${product.name}`}
          className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
        />
      </td>
      <td className="py-3 px-3">
        <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-base">📷</span>
          )}
        </div>
      </td>
      <td className="py-3 px-3.5 font-bold text-slate-900">
        <div className="leading-tight">
          {productLabel ? productLabel(product) || product.name : product.name}
        </div>
      </td>
      <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
        {product.sku || "Auto"}
      </td>
      <td className="py-3 px-3 text-slate-600">{product.category_name || "—"}</td>
      <td className="py-3 px-3 text-slate-600">{product.sub_category_name || "—"}</td>
      <td className="py-3 px-3 text-center">
        {isSerialTracked ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
            ✅ Yes
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500">
            ❌ No
          </span>
        )}
      </td>
      <td className="py-3 px-3 text-center">
        {isWarrantyReq ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
            🛡️ {product.warranty_months || 12}M
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500">
            ❌ No
          </span>
        )}
      </td>
      <td className="py-3 px-3 text-right">
        <span
          className={`font-bold ${
            isLowStock ? "text-rose-600" : "text-emerald-700"
          }`}
        >
          {product.stock} / {product.min_stock}
        </span>
        <span className="text-[11px] text-slate-500 block font-normal">
          {product.unit_name || "Pcs"}
          {product.sub_unit_name ? ` (${product.conversion_rate || 1} ${product.sub_unit_name})` : ""}
        </span>
      </td>
      <td className="py-3 px-3 text-right">
        <TableActionDropdown
          triggerLabel="⋯"
          triggerTitle="Actions"
          triggerClassName="px-2.5 py-1 bg-slate-50 hover:bg-slate-200 border border-slate-300 rounded-md text-xs font-bold text-slate-600"
          items={[
            {
              key: 'edit',
              label: 'Edit Product',
              icon: '✏️',
              onClick: () => handleEditProduct(product),
            },
            {
              key: 'delete',
              label: 'Delete',
              icon: '🗑️',
              danger: true,
              onClick: () => {
                if (
                  window.confirm(
                    `Are you sure you want to delete product "${product.name}"?`
                  )
                ) {
                  deleteProduct(product.id);
                }
              },
            },
            { divider: true },
            {
              key: 'toggle-status',
              label: product.status === 'active' ? 'Inactivate' : 'Activate',
              icon: product.status === 'active' ? '⏸️' : '▶️',
              onClick: () => toggleProductStatus(product),
            },
          ]}
        />
      </td>
    </tr>
  );
}
