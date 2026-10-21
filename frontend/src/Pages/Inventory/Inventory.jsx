import React, { useState } from 'react';
import useInventoryManager, { taka, getWarrantyValidity } from './hooks/useInventoryManager';
import InventoryHeader from './components/InventoryHeader';
import InventoryMetrics from './components/InventoryMetrics';
import InventoryFilters from './components/InventoryFilters';
import InventoryTable from './components/InventoryTable';
import InventoryModalsContainer from './components/InventoryModalsContainer';

export default function Inventory({
  onOpenNewSale,
  readOnly = false,
  isTechnician = false,
}) {
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [quotationProduct, setQuotationProduct] = useState(null);

  const handleOpenQuotation = (product = null) => {
    setQuotationProduct(product);
    setIsQuotationModalOpen(true);
  };

  const inventoryManager = useInventoryManager({ onOpenNewSale });
  const {
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
    categoryList,
    activeWarrantyCount,
    filteredProducts,
    paginatedProducts,
    isAllSelected,
    loadInventory,
    toggleCostVisibility,
    toggleSelectAll,
    toggleSelectRow,
    handleToggleEcommerce,
    handleOpenWarrantyModal,
    handleOpenLabelModal,
    handleOpenTransferModal,
    handleDownloadCsv,
    handleCopyPriceList,
    handlePrintPriceList,
    setCurrentPage,
    handleOpenProductDetails,
  } = inventoryManager;

  return (
    <div className="p-2 sm:p-4 md:p-6 bg-slate-50 min-h-screen font-sans">
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
      <InventoryHeader
        readOnly={readOnly}
        loading={loading}
        loadInventory={loadInventory}
        onOpenQuotation={handleOpenQuotation}
        onOpenTransferModal={handleOpenTransferModal}
      />

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
        isTechnician={isTechnician}
      />

      {/* 3. Unified Compact Control & Filter Bar */}
      <InventoryFilters
        selectedWarehouseId={selectedWarehouseId}
        setSelectedWarehouseId={setSelectedWarehouseId}
        warehouses={warehouses}
        setIsWarehouseModalOpen={inventoryManager.setIsWarehouseModalOpen}
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
        isTechnician={isTechnician}
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
        onOpenNewQuotation={handleOpenQuotation}
        handleOpenLabelModal={handleOpenLabelModal}
        handleOpenTransferModal={handleOpenTransferModal}
        onViewProductDetails={handleOpenProductDetails}
        currentPageSafe={currentPageSafe}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        setCurrentPage={setCurrentPage}
        taka={taka}
        getWarrantyValidity={getWarrantyValidity}
        isTechnician={isTechnician}
      />

      {/* Modals Container */}
      <InventoryModalsContainer
        {...inventoryManager}
        onOpenNewSale={onOpenNewSale}
        handleOpenQuotation={handleOpenQuotation}
        taka={taka}
        getWarrantyValidity={getWarrantyValidity}
        isTechnician={isTechnician}
        isQuotationModalOpen={isQuotationModalOpen}
        setIsQuotationModalOpen={setIsQuotationModalOpen}
        quotationProduct={quotationProduct}
        setQuotationProduct={setQuotationProduct}
      />
    </div>
  );
}
