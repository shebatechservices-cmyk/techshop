import React from 'react';
import WarehouseManageModal from './modals/WarehouseManageModal';
import WarrantyModal from './modals/WarrantyModal';
import LabelPrintModal from './modals/LabelPrintModal';
import StockTransferModal from './modals/StockTransferModal';
import useInventoryManager, { taka, getWarrantyValidity } from './hooks/useInventoryManager';
import InventoryMetrics from './components/InventoryMetrics';
import InventoryFilters from './components/InventoryFilters';
import InventoryTable from './components/InventoryTable';

export default function Inventory({ onOpenNewSale, readOnly = false }) {
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
                Inventory &amp; Central Warehouse
              </h1>
              <span className="text-[0.7rem] font-bold py-0.5 px-2 rounded-full bg-sky-100 text-sky-700">
                LIVE STOCK
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Stock Transfer Action */}
          {!readOnly && (
            <button
              type="button"
              onClick={() => handleOpenTransferModal()}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-md border-0 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer shadow-sm transition-colors"
            >
              <span>🔄</span> Stock Transfer
            </button>
          )}

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

      {/* 2. Warehouse & Valuation Summary Metric Cards */}
      <InventoryMetrics
        summary={summary}
        showCostValuation={showCostValuation}
        setShowCostValuation={setShowCostValuation}
        stockFilter={stockFilter}
        setStockFilter={setStockFilter}
        setCurrentPage={setCurrentPage}
        activeWarrantyCount={activeWarrantyCount}
        taka={taka}
      />

      {/* 3. Unified Compact Control & Filter Bar */}
      <InventoryFilters
        selectedWarehouseId={selectedWarehouseId}
        setSelectedWarehouseId={setSelectedWarehouseId}
        warehouses={warehouses}
        setIsWarehouseModalOpen={setIsWarehouseModalOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        categoryList={categoryList}
        handlePrintPriceList={handlePrintPriceList}
        handleDownloadCsv={handleDownloadCsv}
        handleCopyPriceList={handleCopyPriceList}
        stockFilter={stockFilter}
        setStockFilter={setStockFilter}
        products={products}
        filteredProducts={filteredProducts}
        summary={summary}
      />

      {/* 4. Main Inventory Table & Pagination */}
      <InventoryTable
        loading={loading}
        isAllSelected={isAllSelected}
        toggleSelectAll={toggleSelectAll}
        paginatedProducts={paginatedProducts}
        filteredProducts={filteredProducts}
        selectedProductIds={selectedProductIds}
        toggleSelectRow={toggleSelectRow}
        revealedCostIds={revealedCostIds}
        toggleCostVisibility={toggleCostVisibility}
        warehouses={warehouses}
        selectedWarehouseId={selectedWarehouseId}
        handleOpenWarrantyModal={handleOpenWarrantyModal}
        handleToggleEcommerce={handleToggleEcommerce}
        openActionId={openActionId}
        setOpenActionId={setOpenActionId}
        onOpenNewSale={onOpenNewSale}
        handleOpenLabelModal={handleOpenLabelModal}
        handleOpenTransferModal={handleOpenTransferModal}
        currentPageSafe={currentPageSafe}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        setCurrentPage={setCurrentPage}
        taka={taka}
        getWarrantyValidity={getWarrantyValidity}
      />

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
