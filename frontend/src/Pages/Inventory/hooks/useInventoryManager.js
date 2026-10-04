import { useState } from 'react';
import { money, taka, getWarrantyValidity } from '../utils/inventoryUtils';
import useInventoryData from './useInventoryData';
import useInventoryFilters from './useInventoryFilters';
import useInventorySelection from './useInventorySelection';
import useInventoryModals from './useInventoryModals';
import useInventoryExports from './useInventoryExports';

// Re-export pure helpers for backwards compatibility
export { money, taka, getWarrantyValidity };

/**
 * Orchestrator hook for Inventory & Warehouse management.
 * Composes domain-specific sub-hooks into a unified, clean interface.
 */
export default function useInventoryManager({ onOpenNewSale } = {}) {
  // Notification toast state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showNotification = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // 1. Data management (Products, Warehouses, Live stock sync)
  const data = useInventoryData({ showNotification });

  // 2. Filters, Search & Pagination
  const filters = useInventoryFilters({ products: data.products });

  // 3. Row selection, Checkboxes & Cost Confidentiality
  const selection = useInventorySelection({ paginatedProducts: filters.paginatedProducts });

  // 4. Modals (Details, Warranty, Label Print, Stock Transfer, Warehouse Manage)
  const modals = useInventoryModals({
    products: data.products,
    warehouses: data.warehouses,
    selectedWarehouseId: data.selectedWarehouseId,
    showNotification,
    loadInventory: data.loadInventory,
  });

  // 5. Exports (CSV, Price List)
  const exports = useInventoryExports({
    products: data.products,
    filteredProducts: filters.filteredProducts,
    selectedProductIds: selection.selectedProductIds,
    showNotification,
  });

  return {
    // Data States
    products: data.products,
    setProducts: data.setProducts,
    warehouses: data.warehouses,
    setWarehouses: data.setWarehouses,
    selectedWarehouseId: data.selectedWarehouseId,
    setSelectedWarehouseId: data.setSelectedWarehouseId,
    summary: data.summary,
    loading: data.loading,

    // Filter States
    stockFilter: filters.stockFilter,
    setStockFilter: filters.setStockFilter,
    categoryFilter: filters.categoryFilter,
    setCategoryFilter: filters.setCategoryFilter,
    searchQuery: filters.searchQuery,
    setSearchQuery: filters.setSearchQuery,
    currentPage: filters.currentPage,
    setCurrentPage: filters.setCurrentPage,
    itemsPerPage: filters.itemsPerPage,

    // Selection & Privacy States
    selectedProductIds: selection.selectedProductIds,
    setSelectedProductIds: selection.setSelectedProductIds,
    revealedCostIds: selection.revealedCostIds,
    showCostValuation: selection.showCostValuation,
    setShowCostValuation: selection.setShowCostValuation,
    openActionId: selection.openActionId,
    setOpenActionId: selection.setOpenActionId,

    // Toast
    toast,
    setToast,

    // Modal States
    isWarehouseModalOpen: modals.isWarehouseModalOpen,
    setIsWarehouseModalOpen: modals.setIsWarehouseModalOpen,
    warrantyModalProduct: modals.warrantyModalProduct,
    setWarrantyModalProduct: modals.setWarrantyModalProduct,
    warrantyData: modals.warrantyData,
    setWarrantyData: modals.setWarrantyData,
    labelModalProduct: modals.labelModalProduct,
    setLabelModalProduct: modals.setLabelModalProduct,
    labelQuantity: modals.labelQuantity,
    setLabelQuantity: modals.setLabelQuantity,
    isTransferModalOpen: modals.isTransferModalOpen,
    setIsTransferModalOpen: modals.setIsTransferModalOpen,
    transferForm: modals.transferForm,
    setTransferForm: modals.setTransferForm,
    transferSubmitting: modals.transferSubmitting,
    detailModalProduct: modals.detailModalProduct,
    setDetailModalProduct: modals.setDetailModalProduct,

    // Refs
    printLabelRef: modals.printLabelRef,

    // Computed / Memos
    categoryList: filters.categoryList,
    activeWarrantyCount: filters.activeWarrantyCount,
    filteredProducts: filters.filteredProducts,
    totalPages: filters.totalPages,
    currentPageSafe: filters.currentPageSafe,
    paginatedProducts: filters.paginatedProducts,
    isAllSelected: selection.isAllSelected,

    // Handlers
    showNotification,
    loadInventory: data.loadInventory,
    toggleCostVisibility: selection.toggleCostVisibility,
    toggleSelectAll: selection.toggleSelectAll,
    toggleSelectRow: selection.toggleSelectRow,
    handleToggleEcommerce: data.handleToggleEcommerce,
    handleOpenProductDetails: modals.handleOpenProductDetails,
    handleCloseProductDetails: modals.handleCloseProductDetails,
    handleOpenWarrantyModal: modals.handleOpenWarrantyModal,
    handleOpenLabelModal: modals.handleOpenLabelModal,
    handlePrintLabels: modals.handlePrintLabels,
    handleOpenTransferModal: modals.handleOpenTransferModal,
    handleExecuteTransfer: modals.handleExecuteTransfer,
    handleDownloadCsv: exports.handleDownloadCsv,
    handleCopyPriceList: exports.handleCopyPriceList,
    handlePrintPriceList: exports.handlePrintPriceList,
  };
}
