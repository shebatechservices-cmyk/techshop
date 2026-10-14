import React from 'react';

export default function ProductCatalogFilterBar({
  productFilterQuery,
  setProductFilterQuery,
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
  categoriesList = [],
  setCurrentPage,
  hasActiveFilters,
  handleResetAll,
  filteredProducts = [],
  products = [],
}) {
  return (
    <>
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
    </>
  );
}
