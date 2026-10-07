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
  categoryFilter = "ALL",
  setCategoryFilter,
  statusFilter = "ALL",
  setStatusFilter,
  categoriesList = [],
  resetFilters,
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
  const hasActiveFilters = Boolean(
    (productFilterQuery && productFilterQuery.trim()) ||
    (categoryFilter && categoryFilter !== "ALL") ||
    (statusFilter && statusFilter !== "ALL")
  );

  const handleResetAll = () => {
    if (resetFilters) {
      resetFilters();
    } else {
      setProductFilterQuery?.("");
      setCategoryFilter?.("ALL");
      setStatusFilter?.("ALL");
      setCurrentPage?.(1);
    }
  };

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
          <button
            type="button"
            onClick={() => setStatusFilter?.("ALL")}
            className={`flex flex-col items-center px-4 py-2 rounded-xl border transition-all cursor-pointer ${
              statusFilter === "ALL"
                ? "bg-sky-50 border-sky-300 ring-2 ring-sky-200"
                : "bg-slate-50 border-slate-200 hover:bg-slate-100"
            }`}
            title="Click to view all products"
          >
            <strong className="text-base font-extrabold text-slate-900">{products.length}</strong>
            <small className="text-[10px] font-semibold text-slate-500 uppercase">Total Items</small>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter?.(statusFilter === "active" ? "ALL" : "active")}
            className={`flex flex-col items-center px-4 py-2 rounded-xl border transition-all cursor-pointer ${
              statusFilter === "active"
                ? "bg-emerald-100 border-emerald-400 ring-2 ring-emerald-300"
                : "bg-emerald-50 border-emerald-200 hover:bg-emerald-100/70"
            }`}
            title="Click to filter active products"
          >
            <strong className="text-base font-extrabold text-emerald-700">
              {products.filter((p) => p.status === "active").length}
            </strong>
            <small className="text-[10px] font-semibold text-emerald-600 uppercase">Active</small>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter?.(statusFilter === "low_stock" ? "ALL" : "low_stock")}
            className={`flex flex-col items-center px-4 py-2 rounded-xl border transition-all cursor-pointer ${
              statusFilter === "low_stock"
                ? "bg-rose-100 border-rose-400 ring-2 ring-rose-300"
                : "bg-rose-50 border-rose-200 hover:bg-rose-100/70"
            }`}
            title="Click to filter low stock products"
          >
            <strong className="text-base font-extrabold text-rose-700">
              {products.filter((p) => Number(p.stock) <= Number(p.min_stock)).length}
            </strong>
            <small className="text-[10px] font-semibold text-rose-600 uppercase">Low Stock</small>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar Input */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={productFilterQuery}
            onChange={(e) => {
              setProductFilterQuery?.(e.target.value);
              setCurrentPage?.(1);
            }}
            placeholder="Search products by name, brand, model, SKU, barcode, category..."
            className="w-full pl-10 pr-8 py-2 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all outline-none font-medium text-slate-800 placeholder:text-slate-400"
            style={{ paddingLeft: '2.5rem' }}
          />
          {productFilterQuery && (
            <button
              type="button"
              onClick={() => {
                setProductFilterQuery?.("");
                setCurrentPage?.(1);
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer text-xs font-bold"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Dropdowns and Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium hidden lg:inline">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter?.(e.target.value);
                setCurrentPage?.(1);
              }}
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 outline-none cursor-pointer focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
            >
              <option value="ALL">All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium hidden lg:inline">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter?.(e.target.value);
                setCurrentPage?.(1);
              }}
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 outline-none cursor-pointer focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
            >
              <option value="ALL">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="low_stock">Low Stock Only</option>
            </select>
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetAll}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Reset all filters"
            >
              <span>✕</span>
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Tags Indicator */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between p-3 bg-sky-50/70 border border-sky-200 rounded-xl text-xs text-sky-900 font-semibold shadow-xs flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span>
              Showing <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> products
            </span>
            {productFilterQuery && (
              <span className="inline-flex items-center gap-1 bg-white border border-sky-300 text-sky-800 px-2 py-0.5 rounded-lg text-[11px] font-bold">
                Query: "{productFilterQuery}"
                <button
                  type="button"
                  onClick={() => {
                    setProductFilterQuery?.("");
                    setCurrentPage?.(1);
                  }}
                  className="hover:text-rose-600 font-bold ml-0.5 cursor-pointer"
                  title="Remove query filter"
                >
                  ✕
                </button>
              </span>
            )}
            {categoryFilter !== "ALL" && (
              <span className="inline-flex items-center gap-1 bg-white border border-sky-300 text-sky-800 px-2 py-0.5 rounded-lg text-[11px] font-bold">
                Category: {categoryFilter}
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter?.("ALL");
                    setCurrentPage?.(1);
                  }}
                  className="hover:text-rose-600 font-bold ml-0.5 cursor-pointer"
                  title="Remove category filter"
                >
                  ✕
                </button>
              </span>
            )}
            {statusFilter !== "ALL" && (
              <span className="inline-flex items-center gap-1 bg-white border border-sky-300 text-sky-800 px-2 py-0.5 rounded-lg text-[11px] font-bold">
                Status: {statusFilter === "low_stock" ? "Low Stock" : statusFilter === "active" ? "Active" : "Inactive"}
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter?.("ALL");
                    setCurrentPage?.(1);
                  }}
                  className="hover:text-rose-600 font-bold ml-0.5 cursor-pointer"
                  title="Remove status filter"
                >
                  ✕
                </button>
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleResetAll}
            className="text-xs text-sky-700 hover:text-rose-600 font-bold underline cursor-pointer transition-colors"
          >
            Clear all filters
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
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="text-center py-16 text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="text-3xl">🔍</span>
                      <p className="font-bold text-slate-700 text-sm">No products found</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        {hasActiveFilters
                          ? "No products match your current search query or filter criteria. Try adjusting your filters or search terms."
                          : "No products registered in the catalog yet."}
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleResetAll}
                          className="mt-2 px-3 py-1.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg text-xs font-bold hover:bg-sky-100 cursor-pointer transition-colors shadow-xs"
                        >
                          Clear All Filters
                        </button>
                      )}
                    </div>
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
