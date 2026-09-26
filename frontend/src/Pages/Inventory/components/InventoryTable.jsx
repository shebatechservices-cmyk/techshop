import React from 'react';
import TableActionDropdown from '../../../components/ui/TableActionDropdown';

export default function InventoryTable({
  loading,
  isAllSelected,
  toggleSelectAll,
  paginatedProducts,
  filteredProducts,
  selectedProductIds,
  toggleSelectRow,
  revealedCostIds,
  toggleCostVisibility,
  warehouses,
  selectedWarehouseId,
  handleOpenWarrantyModal,
  handleToggleEcommerce,
  openActionId,
  setOpenActionId,
  onOpenNewSale,
  handleOpenLabelModal,
  handleOpenTransferModal,
  currentPageSafe,
  totalPages,
  itemsPerPage,
  setCurrentPage,
  taka,
  getWarrantyValidity,
}) {
  return (
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
                            className={`bg-transparent border-0 cursor-pointer px-0.5 inline-flex items-center leading-none ${
                              revealedCostIds.has(p.id) ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'
                            }`}
                            title={revealedCostIds.has(p.id) ? 'Hide unit cost' : 'Show unit cost'}
                            aria-label={revealedCostIds.has(p.id) ? 'Hide cost' : 'Show cost'}
                          >
                            {revealedCostIds.has(p.id) ? (
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

                    {/* 9. Actions (Three-Dot Menu via React Portal) */}
                    <td className="py-1 px-2 text-center align-middle">
                      <TableActionDropdown
                        triggerLabel="⋮"
                        triggerTitle="Actions"
                        triggerClassName="border border-slate-300 rounded py-px px-1.5 font-bold text-sm text-slate-600 leading-none"
                        items={[
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
  );
}
