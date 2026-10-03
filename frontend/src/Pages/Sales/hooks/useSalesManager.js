import { useState, useEffect, useCallback } from 'react';
import { useSalesData } from './manager/useSalesData';
import { useSalesFiltering, money } from './manager/useSalesFiltering';
import { useSalesLockPolicy } from './manager/useSalesLockPolicy';
import { useSalesActions } from './manager/useSalesActions';

export { money };
export const taka = (val) =>
  `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function useSalesManager({
  initialTab = 'history',
  initialSearch = '',
  navKey = 0,
  currentUser,
} = {}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'history');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, navKey]);

  // Notifications
  const [notification, setNotification] = useState({ message: '', type: '' });
  const showToast = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 4000);
  }, []);

  // 1. Data Layer
  const {
    sales,
    setSales,
    quotationsCount,
    setQuotationsCount,
    customersCount,
    setCustomersCount,
    modalCustomers,
    setModalCustomers,
    products,
    setProducts,
    loading,
    setLoading,
    shopSettings,
    setShopSettings,
    loadAllData,
    refreshModalData,
  } = useSalesData({ showToast });

  // 2. Filtering & Metrics Layer
  const {
    invoiceSearchQuery,
    setInvoiceSearchQuery,
    invoiceStatusFilter,
    setInvoiceStatusFilter,
    filteredSales,
    totalSalesVolume,
    totalCollectedAmount,
    totalSalesDue,
    getPaymentBadgeStyle,
  } = useSalesFiltering({
    sales,
    initialTab,
    initialSearch,
    navKey,
  });

  // 3. Security & Lock Policy Layer
  const {
    isAdmin,
    overrideModal,
    setOverrideModal,
    getSaleLockStatus,
    handleConfirmOverride: confirmOverrideWithHandlers,
  } = useSalesLockPolicy({
    currentUser,
    shopSettings,
  });

  // 4. Actions & Modals Layer
  const {
    actionLoading,
    setActionLoading,
    selectedSaleForDrawer,
    setSelectedSaleForDrawer,
    isSaleDrawerOpen,
    setIsSaleDrawerOpen,
    isSaleDrawerLoading,
    handleOpenSaleDrawer,
    handleCloseSaleDrawer,
    isSaleModalOpen,
    setIsSaleModalOpen,
    editingSale,
    setEditingSale,
    newlyCreatedCustomer,
    setNewlyCreatedCustomer,
    exchangeSaleId,
    setExchangeSaleId,
    printData,
    setPrintData,
    isPrintOpen,
    setIsPrintOpen,
    handleCustomerCreated,
    handleOpenPrintSale,
    handleSaleCreated,
    handleSaleUpdated,
    executeEditSale,
    handleInitiateEditSale,
    executeDeleteSale,
    handleInitiateDeleteSale,
    handleStartSaleForCustomer,
    handleStartQuoteForCustomer,
  } = useSalesActions({
    loadAllData,
    showToast,
    isAdmin,
    getSaleLockStatus,
    setOverrideModal,
    setActiveTab,
    setCustomersCount,
    setModalCustomers,
  });

  // Refresh product catalog and customer list whenever the New Sale modal opens
  useEffect(() => {
    if (isSaleModalOpen) {
      refreshModalData();
    }
  }, [isSaleModalOpen, refreshModalData]);

  const handleConfirmOverride = useCallback(() => {
    confirmOverrideWithHandlers({
      onConfirmEdit: executeEditSale,
      onConfirmDelete: executeDeleteSale,
    });
  }, [confirmOverrideWithHandlers, executeEditSale, executeDeleteSale]);

  return {
    activeTab,
    setActiveTab,
    isAdmin,
    actionLoading,
    setActionLoading,
    shopSettings,
    setShopSettings,
    overrideModal,
    setOverrideModal,
    sales,
    setSales,
    quotationsCount,
    setQuotationsCount,
    customersCount,
    setCustomersCount,
    modalCustomers,
    products,
    setProducts,
    loading,
    setLoading,
    invoiceSearchQuery,
    setInvoiceSearchQuery,
    invoiceStatusFilter,
    setInvoiceStatusFilter,
    notification,
    showToast,
    isSaleModalOpen,
    setIsSaleModalOpen,
    editingSale,
    setEditingSale,
    newlyCreatedCustomer,
    exchangeSaleId,
    setExchangeSaleId,
    printData,
    setPrintData,
    isPrintOpen,
    setIsPrintOpen,
    selectedSaleForDrawer,
    setSelectedSaleForDrawer,
    isSaleDrawerOpen,
    setIsSaleDrawerOpen,
    isSaleDrawerLoading,
    handleOpenSaleDrawer,
    handleCloseSaleDrawer,
    loadAllData,
    handleCustomerCreated,
    handleSaleCreated,
    handleSaleUpdated,
    getSaleLockStatus,
    executeEditSale,
    handleInitiateEditSale,
    handleOpenPrintSale,
    executeDeleteSale,
    handleInitiateDeleteSale,
    handleConfirmOverride,
    handleStartSaleForCustomer,
    handleStartQuoteForCustomer,
    filteredSales,
    totalSalesVolume,
    totalCollectedAmount,
    totalSalesDue,
    getPaymentBadgeStyle,
    money,
    taka,
  };
}
