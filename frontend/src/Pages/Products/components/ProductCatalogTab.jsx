import React from "react";
import { isProductSerialTracked, isProductWarrantyRequired } from "../../../utils/productUtils";
import TableActionDropdown from "../../../components/ui/TableActionDropdown";

export default function ProductCatalogTab({
  products = [],
  filteredProducts = [],
  visibleProducts = [],
  selectedProductIds = [],
  productFilterQuery = "",
  setProductFilterQuery,
  currentPage = 1,
  setCurrentPage,
  totalProductPages = 1,
  openProductAction,
  setOpenProductAction,
  toggleProduct,
  toggleAllProducts,
  deleteProduct,
  toggleProductStatus,
  handleEditProduct,
  productLabel,
  saveSuccess,
}) {
  return (
    <div className="space-y-4">
      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-bold shadow-xs">
          {saveSuccess}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center flex-wrap gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-600 block mb-0.5">
            Inventory Overview
          </span>
          <h2 className="text-lg font-extrabold text-slate-900">Product Catalog</h2>
          <p className="text-xs text-slate-500">
            View all registered products, stock levels, and active status at a glance.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex flex-col items-center bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
            <strong className="text-base font-extrabold text-slate-900">{products.length}</strong>
            <small className="text-[10px] font-semibold text-slate-500 uppercase">Total Items</small>
          </div>
          <div className="flex flex-col items-center bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
            <strong className="text-base font-extrabold text-emerald-700">
              {products.filter((p) => p.status === "active").length}
            </strong>
            <small className="text-[10px] font-semibold text-emerald-600 uppercase">Active</small>
          </div>
          <div className="flex flex-col items-center bg-rose-50 px-4 py-2 rounded-xl border border-rose-200">
            <strong className="text-base font-extrabold text-rose-700">
              {products.filter((p) => p.stock <= p.min_stock).length}
            </strong>
            <small className="text-[10px] font-semibold text-rose-600 uppercase">Low Stock</small>
          </div>
        </div>
      </div>

      {/* Global Filter Query Indicator */}
      {productFilterQuery && (
        <div className="flex items-center justify-between p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold shadow-xs">
          <span>
            🔍 Filtered by: <strong>"{productFilterQuery}"</strong> ({filteredProducts.length} matches)
          </span>
          <button
            type="button"
            onClick={() => setProductFilterQuery("")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer"
          >
            ✕ Clear Filter
          </button>
        </div>
      )}

      {/* Main Catalog Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={
                      visibleProducts.length > 0 &&
                      visibleProducts.every((p) => selectedProductIds.includes(p.id))
                    }
                    onChange={toggleAllProducts}
                    className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3 w-12">Image</th>
                <th className="py-3 px-3.5 min-w-[200px]">Product Details</th>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Sub-category</th>
                <th className="py-3 px-3 text-center">Serial Tracked</th>
                <th className="py-3 px-3 text-center">Warranty</th>
                <th className="py-3 px-3 text-right">Stock / Min</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleProducts.length > 0 ? (
                visibleProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/70 transition-colors bg-white">
                    <td className="py-3 px-3.5">
                      <input
                        type="checkbox"
                        checked={selectedProductIds.includes(product.id)}
                        onChange={() => toggleProduct(product.id)}
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
                        {productLabel(product) || product.name}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                      {product.sku || "Auto"}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{product.category_name || "—"}</td>
                    <td className="py-3 px-3 text-slate-600">{product.sub_category_name || "—"}</td>
                    <td className="py-3 px-3 text-center">
                      {isProductSerialTracked(product) ? (
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
                      {isProductWarrantyRequired(product) ? (
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
                          product.stock <= product.min_stock
                            ? "text-rose-600"
                            : "text-emerald-700"
                        }`}
                      >
                        {product.stock} / {product.min_stock}
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
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="text-center py-16 text-slate-400 font-medium">
                    No products found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex justify-between items-center p-3.5 bg-slate-50 border-t border-slate-200 text-xs">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            Previous
          </button>
          <span className="font-semibold text-slate-600">
            Page {currentPage} of {totalProductPages}
          </span>
          <button
            type="button"
            disabled={currentPage === totalProductPages}
            onClick={() => setCurrentPage((p) => Math.min(totalProductPages, p + 1))}
            className="px-3 py-1.5 bg-sky-600 border border-sky-600 rounded-lg text-white font-bold hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-xs"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
