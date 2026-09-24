import React from 'react';

export default function InventoryFilters({
  selectedWarehouseId,
  setSelectedWarehouseId,
  warehouses,
  setIsWarehouseModalOpen,
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  categoryList,
  handlePrintPriceList,
  handleDownloadCsv,
  handleCopyPriceList,
  stockFilter,
  setStockFilter,
  products,
  filteredProducts,
  summary,
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-2 sm:px-3 mb-3 flex flex-col gap-2 shadow-sm">
      {/* Row 1: Warehouse + Search + Category + Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Warehouse Selector & Manage Trigger */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-600">📍 Warehouse:</span>
          <select
            value={selectedWarehouseId}
            onChange={(e) => {
              if (e.target.value === '__manage__') {
                setIsWarehouseModalOpen(true);
              } else {
                setSelectedWarehouseId(Number(e.target.value));
              }
            }}
            className="py-1 px-2.5 rounded-md border border-sky-600 bg-sky-50 text-sky-700 font-bold text-xs cursor-pointer outline-none"
          >
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name} {wh.is_default ? '★ (Default)' : ''}
              </option>
            ))}
            <option value="__manage__">➕ Manage Warehouses...</option>
          </select>

          <button
            type="button"
            onClick={() => setIsWarehouseModalOpen(true)}
            className="py-1 px-2 rounded-md border border-sky-200 bg-sky-100 hover:bg-sky-200 text-sky-700 font-bold text-xs cursor-pointer inline-flex items-center gap-1 transition-colors"
            title="Add, edit, or configure warehouses & branches"
          >
            <span>⚙️</span>
            <span>Manage</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex-1 min-w-[200px] relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search product, SKU, barcode..."
            className="w-full py-1 pl-7 pr-7 rounded-md border border-slate-300 text-xs outline-none box-border focus:border-sky-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-0 text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="py-1 px-2.5 rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-700 cursor-pointer outline-none"
        >
          <option value="ALL">All Categories</option>
          {categoryList.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Export/Print Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrintPriceList}
            className="py-1 px-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer flex items-center gap-1 transition-colors"
            title="Print formatted price catalog"
          >
            <span>🖨️</span> Print
          </button>
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="py-1 px-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer flex items-center gap-1 transition-colors"
            title="Download Excel / CSV"
          >
            <span>📥</span> CSV
          </button>
          <button
            type="button"
            onClick={handleCopyPriceList}
            className="py-1 px-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer flex items-center gap-1 transition-colors"
            title="Copy price list text"
          >
            <span>📋</span> Share
          </button>
        </div>
      </div>

      {/* Row 2: Status Pills inline */}
      <div className="flex items-center justify-between flex-wrap gap-1.5">
        <div className="flex gap-1 flex-wrap">
          {[
            { id: 'all', label: `All (${products.length})`, activeClass: 'bg-slate-900 text-white', idleClass: 'bg-slate-100 hover:bg-slate-200 text-slate-600' },
            { id: 'in_stock', label: `In Stock (${products.filter((p) => p.stock > 0).length})`, activeClass: 'bg-green-600 text-white', idleClass: 'bg-green-50 hover:bg-green-100 text-green-700' },
            { id: 'low_stock', label: `Low Stock (${summary.low_stock_count})`, activeClass: 'bg-orange-600 text-white', idleClass: 'bg-orange-50 hover:bg-orange-100 text-orange-700' },
            { id: 'out_of_stock', label: `Out of Stock (${summary.out_of_stock_count})`, activeClass: 'bg-red-600 text-white', idleClass: 'bg-red-50 hover:bg-red-100 text-red-700' },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setStockFilter(st.id)}
              className={`py-1 px-2.5 rounded border-0 font-bold text-xs cursor-pointer transition-colors ${
                stockFilter === st.id ? st.activeClass : st.idleClass
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500">
          Showing <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> products
        </span>
      </div>
    </div>
  );
}
