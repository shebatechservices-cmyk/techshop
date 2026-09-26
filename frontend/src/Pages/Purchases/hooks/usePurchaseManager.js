import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePurchaseData } from './manager/usePurchaseData';
import { usePurchaseFiltering } from './manager/usePurchaseFiltering';
import { usePurchaseActions } from './manager/usePurchaseActions';
import { getQuotationBadgeStyle } from '../utils/purchaseFormatters';

export default function usePurchaseManager({
  initialTab = 'history',
  initialSearch = '',
  navKey = 0,
} = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  const getActiveTab = () => {
    if (pathname.endsWith('/quotations') || pathname.includes('/quotations'))
      return 'quotations';
    if (pathname.endsWith('/suppliers') || pathname.includes('/suppliers'))
      return 'suppliers';
    return 'history';
  };
  const activeTab = getActiveTab();

  useEffect(() => {
    if (initialTab && initialTab !== activeTab && initialTab !== 'history') {
      navigate(`/${initialTab}`);
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
    orders,
    setOrders,
    quotations,
    setQuotations,
    suppliers,
    setSuppliers,
    products,
    setProducts,
    loading,
    loadAllData,
  } = usePurchaseData({ showToast });

  // 2. Filtering & Metrics Layer
  const {
    searchQuery,
    setSearchQuery,
    filteredOrders,
    filteredQuotations,
    filteredSuppliers,
    totalPurchasesCost,
    totalPurchasesPaid,
    totalPurchasesDue,
    totalQuotationAmount,
    totalSupplierDue,
  } = usePurchaseFiltering({
    orders,
    quotations,
    suppliers,
    initialSearch,
    navKey,
  });

  // 3. Actions & Modals Layer
  const {
    isOrderModalOpen,
    setIsOrderModalOpen,
    orderToEdit,
    setOrderToEdit,
    openActionOrderId,
    setOpenActionOrderId,
    isQuotationModalOpen,
    setIsQuotationModalOpen,
    editingQuotation,
    setEditingQuotation,
    isSupplierModalOpen,
    setIsSupplierModalOpen,
    newlyCreatedSupplier,
    setNewlyCreatedSupplier,
    printOrder,
    setPrintOrder,
    isPrintOpen,
    setIsPrintOpen,
    profileModalPartyId,
    setProfileModalPartyId,
    profileModalTab,
    setProfileModalTab,
    deleteBlockedDialog,
    setDeleteBlockedDialog,
    handleOpenPrintOrder,
    handleOpenAddSupplier,
    handleSupplierCreated,
    handleEditOrder,
    handleDeleteOrder,
    handleDeleteQuotation,
    handleEditQuotation,
    handleUpdateQuotationStatus,
    handleDeleteSupplier,
  } = usePurchaseActions({
    loadAllData,
    showToast,
    setQuotations,
    navigate,
  });

  // Click outside listener for table actions
  useEffect(() => {
    const handleDocClick = () => setOpenActionOrderId(null);
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, [setOpenActionOrderId]);

  return {
    // Navigation
    activeTab,
    navigate,

    // Core Data
    orders,
    setOrders,
    quotations,
    setQuotations,
    suppliers,
    setSuppliers,
    products,
    setProducts,
    loading,
    searchQuery,
    setSearchQuery,
    notification,
    showToast,

    // Modal States
    isOrderModalOpen,
    setIsOrderModalOpen,
    orderToEdit,
    setOrderToEdit,
    openActionOrderId,
    setOpenActionOrderId,
    isQuotationModalOpen,
    setIsQuotationModalOpen,
    editingQuotation,
    setEditingQuotation,
    isSupplierModalOpen,
    setIsSupplierModalOpen,
    newlyCreatedSupplier,
    setNewlyCreatedSupplier,
    printOrder,
    setPrintOrder,
    isPrintOpen,
    setIsPrintOpen,
    profileModalPartyId,
    setProfileModalPartyId,
    profileModalTab,
    setProfileModalTab,
    deleteBlockedDialog,
    setDeleteBlockedDialog,

    // Action Handlers
    loadAllData,
    handleOpenPrintOrder,
    handleOpenAddSupplier,
    handleSupplierCreated,
    handleEditOrder,
    handleDeleteOrder,
    handleDeleteQuotation,
    handleEditQuotation,
    handleUpdateQuotationStatus,
    handleDeleteSupplier,

    // Filtered Lists & Totals
    filteredOrders,
    filteredQuotations,
    filteredSuppliers,
    totalPurchasesCost,
    totalPurchasesPaid,
    totalPurchasesDue,
    totalQuotationAmount,
    totalSupplierDue,
    getQuotationBadgeStyle,
  };
}
