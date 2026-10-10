import React from 'react';
import InventoryTableRow from './table/InventoryTableRow';
import InventoryPagination from './table/InventoryPagination';

export default function InventoryTable({
  loading,
  isAllSelected,
  toggleSelectAll,
  paginatedProducts = [],
  filteredProducts = [],
  selectedProductIds = [],
  toggleSelectRow,
  revealedCostIds,
  toggleCostVisibility,
  warehouses = [],
  selectedWarehouseId,
  handleOpenWarrantyModal,
  handleToggleEcommerce,
  onOpenNewSale,
  onOpenNewQuotation,
  handleOpenLabelModal,
  handleOpenTransferModal,
  onViewProductDetails,
  currentPageSafe,
  totalPages,
  itemsPerPage,
  setCurrentPage,
  taka,
  getWarrantyValidity,
  isTechnician = false,
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
              {/* 3. Product Info */}
              <th className="py-2 px-3 min-w-[220px]">Product Details</th>
              {/* 4. Stock & Inflow Record */}
              <th className="py-2 px-2.5 text-center min-w-[105px]">Stock / Inflow</th>
              {/* 5. Pricing (Sale Price & Cost) */}
              <th className="py-2 px-3 text-right min-w-[115px]">
                {isTechnician ? 'Sale Price' : 'Price (Sale / Cost)'}
              </th>
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
              paginatedProducts.map((p) => (
                <InventoryTableRow
                  key={p.id}
                  product={p}
                  isSelected={selectedProductIds.includes(p.id)}
                  toggleSelectRow={toggleSelectRow}
                  warehouses={warehouses}
                  selectedWarehouseId={selectedWarehouseId}
                  revealedCostIds={revealedCostIds}
                  toggleCostVisibility={toggleCostVisibility}
                  taka={taka}
                  getWarrantyValidity={getWarrantyValidity}
                  handleOpenWarrantyModal={handleOpenWarrantyModal}
                  handleToggleEcommerce={handleToggleEcommerce}
                  onViewProductDetails={onViewProductDetails}
                  onOpenNewSale={onOpenNewSale}
                  onOpenNewQuotation={onOpenNewQuotation}
                  handleOpenLabelModal={handleOpenLabelModal}
                  handleOpenTransferModal={handleOpenTransferModal}
                  isTechnician={isTechnician}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bottom Toolbar */}
      <InventoryPagination
        currentPageSafe={currentPageSafe}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        filteredProductsCount={filteredProducts.length}
        setCurrentPage={setCurrentPage}
      />
    </div>
  );
}
