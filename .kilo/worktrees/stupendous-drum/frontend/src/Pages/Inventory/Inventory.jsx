import React from 'react';
import WarehouseManageModal from './WarehouseManageModal';
import WarrantyModal from './modals/WarrantyModal';
import LabelPrintModal from './modals/LabelPrintModal';
import StockTransferModal from './modals/StockTransferModal';
import useInventoryManager, { taka, getWarrantyValidity } from './hooks/useInventoryManager';

export default function Inventory({ onOpenNewSale }) {
  const {
    // States
    products,
    warehouses,
    selectedWarehouseId,
    setSelectedWarehouseId,
    summary,
    loading,
    stockFilter,
    setStockFilter,
    categoryFilter,
    setCategoryFilter,
    searchQuery,
    setSearchQuery,
    selectedProductIds,
    revealedCostIds,
    showCostValuation,
    setShowCostValuation,
    openActionId,
    setOpenActionId,
    currentPageSafe,
    totalPages,
    itemsPerPage,
    toast,
    isWarehouseModalOpen,
    setIsWarehouseModalOpen,
    warrantyModalProduct,
    setWarrantyModalProduct,
    warrantyData,
    labelModalProduct,
    setLabelModalProduct,
    labelQuantity,
    setLabelQuantity,
    isTransferModalOpen,
    setIsTransferModalOpen,
    transferForm,
    setTransferForm,
    transferSubmitting,

    // Refs
    printLabelRef,

    // Computed / Memos
    categoryList,
    activeWarrantyCount,
    filteredProducts,
    paginatedProducts,
    isAllSelected,

    // Handlers
    loadInventory,
    toggleCostVisibility,
    toggleSelectAll,
    toggleSelectRow,
    handleToggleEcommerce,
    handleOpenWarrantyModal,
    handleOpenLabelModal,
    handlePrintLabels,
    handleOpenTransferModal,
    handleExecuteTransfer,
    handleDownloadCsv,
    handleCopyPriceList,
    handlePrintPriceList,
    setCurrentPage,
  } = useInventoryManager({ onOpenNewSale });

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans">
      {/* Toast notification */}
      {toast.show && (
        <div
          className={`fixed top-5 right-6 z-[99999] py-3 px-5 rounded-lg font-semibold text-sm shadow-xl flex items-center gap-2.5 animate-fadeIn text-white ${
            toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
          }`}
        >
          <span>{toast.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. Sleek Compact Header */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b-[1.5px] border-slate-200 flex-wrap gap-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏢</span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 m-0">
                Inventory & Central Warehouse
              </h1>
              <span className="text-[0.7rem] font-bold py-0.5 px-2 rounded-full bg-sky-100 text-sky-700">
                LIVE STOCK
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Stock Transfer Action */}
          <button
            type="button"
            onClick={() => handleOpenTransferModal()}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-md border-0 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer shadow-sm transition-colors"
          >
            <span>🔄</span> Stock Transfer
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={loadInventory}
            disabled={loading}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs cursor-pointer transition-colors disabled:opacity-50"
          >
            <span className={`inline-block transition-transform duration-500 ${loading ? 'rotate-180' : ''}`}>🔄</span>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* 2. Warehouse & Valuation Summary Metric Cards (Compact & Condensed) */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2 mb-3">
        {/* Total SKUs */}
        <div
          className="bg-white py-2 px-3 rounded-lg border border-slate-200 shadow-sm"
          title="Total unique registered products in catalog"
        >
          <div className="flex justify-between items-center">
            <span className="text-[0.68rem] font-bold text-slate-500 uppercase tracking-wider">Total SKUs</span>
            <span className="text-sm">📦</span>
          </div>
          <div className="text-lg font-extrabold text-slate-900 mt-0.5 leading-tight">
            {summary.total_products.toLocaleString()}
          </div>
        </div>

        {/* Total Stock Units */}
        <div
          className="bg-white py-2 px-3 rounded-lg border border-slate-200 shadow-sm"
          title="Total physical inventory units across all warehouse locations"
        >
          <div className="flex justify-between items-center">
            <span className="text-[0.68rem] font-bold text-sky-600 uppercase tracking-wider">In-Stock Units</span>
            <span className="text-sm">📊</span>
          </div>
          <div className="text-lg font-extrabold text-sky-600 mt-0.5 leading-tight">
            {summary.total_units.toLocaleString()} <span className="text-xs font-semibold text-sky-600/80">pcs</span>
          </div>
        </div>

        {/* Stock Valuation (Cost Basis) */}
        <div
          className="bg-white py-2 px-3 rounded-lg border border-slate-200 shadow-sm"
          title="Total stock capital valuation based on unit cost"
        >
          <div className="flex justify-between items-center">
            <span className="text-[0.68rem] font-bold text-slate-600 uppercase tracking-wider">Cost Valuation</span>
            <button
              type="button"
              onClick={() => setShowCostValuation(!showCostValuation)}
              className="bg-transparent border-0 cursor-pointer text-xs text-slate-500 p-0 leading-none"
              title={showCostValuation ? 'Hide Cost Valuation' : 'Show Cost Valuation'}
            >
              {showCostValuation ? '👁️' : '🙈'}
            </button>
          </div>
          <div className="text-lg font-extrabold text-slate-700 mt-0.5 leading-tight">
            {showCostValuation ? taka(summary.total_cost_valuation) : '৳ ••••••'}
          </div>
        </div>

        {/* Retail Valuation */}
        <div
          className="bg-white py-2 px-3 rounded-lg border border-slate-200 shadow-sm"
          title="Estimated total retail sales value"
        >
          <div className="flex justify-between items-center">
            <span className="text-[0.68rem] font-bold text-green-600 uppercase tracking-wider">Retail Value</span>
            <span className="text-sm">📈</span>
          </div>
          <div className="text-lg font-extrabold text-green-600 mt-0.5 leading-tight">
            {taka(summary.total_retail_valuation)}
          </div>
        </div>

        {/* Low Stock Warning (Interactive Click to Filter) */}
        <div
          onClick={() => {
            setStockFilter(stockFilter === 'low_stock' ? 'all' : 'low_stock');
            setCurrentPage(1);
          }}
          className={`py-2 px-3 rounded-lg cursor-pointer transition-all shadow-sm ${
            stockFilter === 'low_stock'
              ? 'bg-orange-50 border-[1.5px] border-orange-600'
              : 'bg-white border border-orange-200 hover:border-orange-300'
          }`}
          title="Click to filter products with low stock (Reorder needed)"
        >
          <div className="flex justify-between items-center">
            <span className="text-[0.68rem] font-bold text-orange-700 uppercase tracking-wider">
              Low Stock {stockFilter === 'low_stock' && '✓'}
            </span>
            <span className="text-sm">⚠️</span>
          </div>
          <div className="text-lg font-extrabold text-orange-600 mt-0.5 leading-tight">
            {summary.low_stock_count} <span className="text-xs font-semibold text-orange-700/80">items</span>
          </div>
        </div>

        {/* Out of Stock Warning (Interactive Click to Filter) */}
        <div
          onClick={() => {
            setStockFilter(stockFilter === 'out_of_stock' ? 'all' : 'out_of_stock');
            setCurrentPage(1);
          }}
          className={`py-2 px-3 rounded-lg cursor-pointer transition-all shadow-sm ${
            stockFilter === 'out_of_stock'
              ? 'bg-red-50 border-[1.5px] border-red-600'
              : 'bg-white border border-red-200 hover:border-red-300'
          }`}
          title="Click to filter out of stock products"
        >
          <div className="flex justify-between items-center">
            <span className="text-[0.68rem] font-bold text-red-700 uppercase tracking-wider">
              Out of Stock {stockFilter === 'out_of_stock' && '✓'}
            </span>
            <span className="text-sm">🚫</span>
          </div>
          <div className="text-lg font-extrabold text-red-600 mt-0.5 leading-tight">
            {summary.out_of_stock_count} <span className="text-xs font-semibold text-red-700/80">items</span>
          </div>
        </div>

        {/* Supplier 60-Day Warranty Tracking Status */}
        <div
          className="bg-white py-2 px-3 rounded-lg border border-slate-200 shadow-sm"
          title="Active supplier warranty tracking with 60-day validity"
        >
          <div className="flex justify-between items-center">
            <span className="text-[0.68rem] font-bold text-sky-700 uppercase tracking-wider">Warranty</span>
            <span className="text-sm">🛡️</span>
          </div>
          <div className="text-lg font-extrabold text-sky-600 mt-0.5 leading-tight">
            {activeWarrantyCount} <span className="text-xs font-semibold text-sky-700/80">active</span>
          </div>
        </div>
      </div>

      {/* 3. Unified Compact Control & Filter Bar */}
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

      {/* 4. Main Inventory Table (High Density & Merged Columns) */}
      <div className="bg-white rounded-xl border border-slate-300 overflow-visible min-h-[280px] shadow-sm">
        <div className="overflow-x-auto min-h-[260px]">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-200 text-slate-600 text-[0.72rem] uppercase tracking-wider">
                {/* 1. Checkbox */}
                <th className="py-2 px-2.5 w-9 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="cursor-pointer"
                    title="Select All"
                  />
                </th>
                {/* 2. Image */}
                <th className="py-2 px-1.5 w-11 text-center">Img</th>
                {/* 3. Product Info (Merged Title + SKU + Category) */}
                <th className="py-2 px-3 min-w-[220px]">Product Details</th>
                {/* 4. Stock & Inflow Record */}
                <th className="py-2 px-2.5 text-center min-w-[105px]">Stock / Inflow</th>
                {/* 5. Pricing (Sale Price & Cost) */}
                <th className="py-2 px-3 text-right min-w-[115px]">Price (Sale / Cost)</th>
                {/* 6. Inventory Aging */}
                <th className="py-2 px-2 text-center min-w-[75px]">Aging</th>
                {/* 7. Supplier Warranty */}
                <th className="py-2 px-2.5 text-center min-w-[120px]">Supplier Warranty</th>
                {/* 8. E-Commerce */}
                <th className="py-2 px-2 text-center min-w-[75px]">E-Com</th>
                {/* 9. Actions */}
                <th className="py-2 px-2.5 text-center w-12">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-9 px-4 text-slate-500">
                    <div className="text-xl mb-1.5 animate-spin inline-block">🔄</div>
                    <div>Loading warehouse inventory...</div>
                  </td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 px-4 text-slate-500">
                    <div className="text-2xl mb-1.5">📦</div>
                    <div className="font-bold text-sm text-slate-800">
                      No inventory records found
                    </div>
                    <p className="mt-1 mb-0 text-xs text-slate-400">
                      Try adjusting your search query, stock status, or category filter.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const stock = Number(p.stock || 0);
                  const minStock = Number(p.min_stock || 5);
                  const isOut = stock <= 0;
                  const isLow = stock <= minStock && !isOut;
                  const isSelected = selectedProductIds.includes(p.id);
                  const agingDays = Number(p.aging_days || 0);
                  const isAged60Plus = agingDays >= 60;

                  // Compute Supplier Warranty Expiry Date (Purchase Date + Supplier Warranty Months)
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

                  const validity = expDateStr ? getWarrantyValidity(expDateStr) : null;

                  return (
                    <tr
                      key={p.id}
                      className={`border-b border-slate-100 transition-colors ${
                        isSelected ? 'bg-sky-50' : 'bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      {/* 1. Checkbox */}
                      <td className="py-1 px-2 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(p.id)}
                          className="cursor-pointer"
                        />
                      </td>

                      {/* 2. Image Thumbnail */}
                      <td className="py-1 px-1.5 text-center align-middle">
                        <div className="w-[30px] h-[30px] rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden mx-auto">
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm">📷</span>
                          )}
                        </div>
                      </td>

                      {/* 3. Product Info: Title + SKU + Category (Cleaned & Compact) */}
                      <td className="py-1 px-2.5 align-middle">
                        <div className="flex flex-col gap-px">
                          <div className="font-bold text-slate-900 text-xs leading-snug">
                            {p.composite_name || p.name}
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap mt-px">
                            {/* SKU / Barcode Pill */}
                            <span
                              className="font-mono text-[0.66rem] font-bold text-sky-600 bg-sky-50 border border-sky-200 py-px px-1 rounded whitespace-nowrap"
                              title={`SKU / Barcode: ${p.sku || p.barcode || 'N/A'}`}
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

                      {/* 4. Stock & Record (Condensed Pill) */}
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
                            title={`Available in ${warehouses.find((w) => w.id === selectedWarehouseId)?.name || 'Warehouse'}`}
                          >
                            <span>{isOut ? '🚫' : isLow ? '⚠️' : '✓'}</span>
                            <span>{stock} pcs</span>
                          </span>
                          <span className="text-[0.62rem] text-slate-400 font-semibold whitespace-nowrap" title="Total recorded inflow">
                            Inflow: {p.total_inflow_units || p.purchase_count || stock}
                          </span>
                        </div>
                      </td>

                      {/* 5. Pricing (Sale Price & Cost Price) */}
                      <td className="py-1 px-2.5 text-right align-middle">
                        <div className="flex flex-col items-end gap-px">
                          <span className="font-extrabold text-slate-900 text-xs" title="Retail Selling Price">
                            {taka(p.sale_price)}
                          </span>
                          <div className="inline-flex items-center gap-1 text-[0.66rem] text-slate-500">
                            <span>Cost:</span>
                            <span className="font-bold text-slate-600 font-mono">
                              {revealedCostIds.has(p.id) ? taka(p.cost_price) : '৳••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleCostVisibility(p.id)}
                              className={`bg-transparent border-0 cursor-pointer px-0.5 text-[0.7rem] leading-none ${
                                revealedCostIds.has(p.id) ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'
                              }`}
                              title={revealedCostIds.has(p.id) ? 'Hide unit cost' : 'Show unit cost'}
                              aria-label={revealedCostIds.has(p.id) ? 'Hide cost' : 'Show cost'}
                            >
                              {revealedCostIds.has(p.id) ? '👁️' : '🙈'}
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
                          <span className="text-[0.72rem] text-slate-500 font-semibold whitespace-nowrap" title={p.purchase_date ? `Purchased: ${p.purchase_date}` : ''}>
                            {agingDays > 0 ? `${agingDays}d` : (p.purchase_date ? 'Today' : '—')}
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
                              <span>{new Date(expDateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}</span>
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
                      <td className="py-1 px-2 text-center align-middle relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenActionId((current) => (current === p.id ? null : p.id));
                          }}
                          className={`border border-slate-300 rounded py-px px-1.5 cursor-pointer font-bold text-sm text-slate-600 leading-none transition-colors ${
                            openActionId === p.id ? 'bg-slate-200' : 'bg-slate-50 hover:bg-slate-100'
                          }`}
                          title="Actions"
                          aria-label="Actions"
                        >
                          ⋮
                        </button>

                        {openActionId === p.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-2 top-[calc(100%+2px)] bg-white rounded-lg border border-slate-300 shadow-2xl z-[1000] min-w-[150px] py-1 text-left"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionId(null);
                                if (onOpenNewSale) {
                                  onOpenNewSale(p);
                                } else {
                                  showNotification(`Starting sale for "${p.composite_name || p.name}"`);
                                }
                              }}
                              className="w-full flex items-center gap-2 py-1.5 px-3 bg-transparent hover:bg-green-50 border-0 text-xs font-semibold text-green-800 cursor-pointer transition-colors"
                            >
                              <span>🛒</span> New Sale
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionId(null);
                                handleOpenLabelModal(p);
                              }}
                              className="w-full flex items-center gap-2 py-1.5 px-3 bg-transparent hover:bg-slate-50 border-0 text-xs font-semibold text-slate-700 cursor-pointer transition-colors"
                            >
                              <span>🏷️</span> Print Labels
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionId(null);
                                handleOpenTransferModal(p);
                              }}
                              className="w-full flex items-center gap-2 py-1.5 px-3 bg-transparent hover:bg-sky-50 border-0 text-xs font-semibold text-sky-600 cursor-pointer transition-colors"
                            >
                              <span>🔄</span> Transfer Stock
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination Bottom Controls */}
        <div className="flex justify-between items-center py-3 px-5 bg-slate-50 border-t border-slate-200 flex-wrap gap-3">
          <div className="text-xs text-slate-500">
            Showing{' '}
            <strong>
              {filteredProducts.length === 0 ? 0 : (currentPageSafe - 1) * itemsPerPage + 1}
            </strong>{' '}
            to{' '}
            <strong>
              {Math.min(currentPageSafe * itemsPerPage, filteredProducts.length)}
            </strong>{' '}
            of <strong>{filteredProducts.length}</strong> products
          </div>

          <div className="flex items-center gap-1.5">
            {/* Previous Button */}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPageSafe <= 1}
              className="py-1.5 px-3 rounded-md border border-slate-300 text-xs font-semibold transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              « Previous
            </button>

            {/* Numeric Page Buttons */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                if (totalPages <= 7) return true;
                return (
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPageSafe) <= 1
                );
              })
              .map((page, idx, arr) => {
                const prevPage = arr[idx - 1];
                const showEllipsis = prevPage && page - prevPage > 1;

                return (
                  <React.Fragment key={`page-${page}`}>
                    {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                    <button
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`py-1.5 px-3 rounded-md text-xs cursor-pointer min-w-[32px] transition-colors ${
                        page === currentPageSafe
                          ? 'border-0 bg-sky-600 text-white font-bold'
                          : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                );
              })}

            {/* Next Button */}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPageSafe >= totalPages}
              className="py-1.5 px-3 rounded-md border border-slate-300 text-xs font-semibold transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Next »
            </button>
          </div>
        </div>
      </div>

      {/* Modal 1: Warranty & Serial Numbers */}
      <WarrantyModal
        product={warrantyModalProduct}
        warrantyData={warrantyData}
        onClose={() => setWarrantyModalProduct(null)}
      />

      {/* Modal 2: Print Barcode & Price Labels */}
      <LabelPrintModal
        product={labelModalProduct}
        labelQuantity={labelQuantity}
        setLabelQuantity={setLabelQuantity}
        onPrint={handlePrintLabels}
        onClose={() => setLabelModalProduct(null)}
        printLabelRef={printLabelRef}
      />

      {/* Modal 3: Stock Transfer */}
      <StockTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        products={products}
        warehouses={warehouses}
        transferForm={transferForm}
        setTransferForm={setTransferForm}
        onSubmit={handleExecuteTransfer}
        transferSubmitting={transferSubmitting}
      />

      {/* Modal 4: Centralized Warehouse Management Modal */}
      <WarehouseManageModal
        isOpen={isWarehouseModalOpen}
        onClose={() => setIsWarehouseModalOpen(false)}
        onWarehouseUpdated={(updatedList) => {
          if (updatedList && !updatedList.some((w) => w.id === selectedWarehouseId && w.is_active)) {
            const def = updatedList.find((w) => w.is_default && w.is_active) || updatedList[0];
            if (def) setSelectedWarehouseId(def.id);
          }
          loadInventory();
        }}
      />
    </div>
  );
}
