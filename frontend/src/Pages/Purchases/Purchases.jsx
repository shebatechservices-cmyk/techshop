import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import usePurchaseManager from './hooks/usePurchaseManager';
import PurchaseHistoryTab from './components/PurchaseHistoryTab';
import PurchaseQuotationsTab from './components/PurchaseQuotationsTab';
import PurchaseSuppliersTab from './components/PurchaseSuppliersTab';
import PurchasesHeaderNav from './components/PurchasesHeaderNav';
import PurchasesModals from './components/PurchasesModals';
import { loadDraft, PURCHASE_DRAFT_KEY } from '../../utils/draftRecovery';

export default function Purchases({ onOpenAddProduct, initialTab = 'history', initialSearch = '', navKey = 0 }) {
  const {
    activeTab,
    navigate,
    orders,
    quotations,
    suppliers,
    products,
    loading,
    searchQuery,
    setSearchQuery,
    notification,
    showToast,
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
    printOrder,
    isPrintOpen,
    setIsPrintOpen,
    profileModalPartyId,
    setProfileModalPartyId,
    profileModalTab,
    setProfileModalTab,
    deleteBlockedDialog,
    setDeleteBlockedDialog,
    selectedOrderForDrawer,
    isOrderDrawerOpen,
    isOrderDrawerLoading,
    handleOpenOrderDrawer,
    handleCloseOrderDrawer,
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
    filteredOrders,
    filteredQuotations,
    filteredSuppliers,
    totalPurchasesCost,
    totalPurchasesPaid,
    totalPurchasesDue,
    totalQuotationAmount,
    totalSupplierDue,
    getQuotationBadgeStyle,
  } = usePurchaseManager({ initialTab, initialSearch, navKey });

  // Check for unsaved recoverable purchase draft
  const purchaseDraftInfo = React.useMemo(() => {
    try {
      const d = loadDraft(PURCHASE_DRAFT_KEY);
      if (d && d.data && ((Array.isArray(d.data.items) && d.data.items.length > 0) || d.data.supplierId)) {
        return d;
      }
      return null;
    } catch {
      return null;
    }
  }, [isOrderModalOpen]);

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'inherit' }}>
      {/* Toast Notification */}
      {notification.message && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 99999,
            padding: '12px 20px',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '0.9rem',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
            background: notification.type === 'error' ? '#ef4444' : '#10b981',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>{notification.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* 1. Consolidated Header, Tabs & Action Buttons */}
      <PurchasesHeaderNav
        activeTab={activeTab}
        ordersCount={orders.length}
        quotationsCount={quotations.length}
        suppliersCount={suppliers.length}
        setSearchQuery={setSearchQuery}
        navigate={navigate}
        setIsOrderModalOpen={setIsOrderModalOpen}
        setIsQuotationModalOpen={setIsQuotationModalOpen}
        setIsSupplierModalOpen={setIsSupplierModalOpen}
        purchaseDraftInfo={purchaseDraftInfo}
      />

      <Routes>
        <Route
          path="history"
          element={
            <PurchaseHistoryTab
              orders={orders}
              filteredOrders={filteredOrders}
              loading={loading}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              loadAllData={loadAllData}
              setIsOrderModalOpen={setIsOrderModalOpen}
              openActionOrderId={openActionOrderId}
              setOpenActionOrderId={setOpenActionOrderId}
              handleOpenPrintOrder={handleOpenPrintOrder}
              handleOpenOrderDrawer={handleOpenOrderDrawer}
              handleEditOrder={handleEditOrder}
              handleDeleteOrder={handleDeleteOrder}
              totalPurchasesCost={totalPurchasesCost}
              totalPurchasesPaid={totalPurchasesPaid}
              totalPurchasesDue={totalPurchasesDue}
            />
          }
        />

        <Route
          path="quotations"
          element={
            <PurchaseQuotationsTab
              quotations={quotations}
              filteredQuotations={filteredQuotations}
              loading={loading}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              loadAllData={loadAllData}
              setIsQuotationModalOpen={setIsQuotationModalOpen}
              handleEditQuotation={handleEditQuotation}
              handleDeleteQuotation={handleDeleteQuotation}
              handleUpdateQuotationStatus={handleUpdateQuotationStatus}
              getQuotationBadgeStyle={getQuotationBadgeStyle}
              totalQuotationAmount={totalQuotationAmount}
            />
          }
        />

        <Route
          path="suppliers"
          element={
            <PurchaseSuppliersTab
              suppliers={suppliers}
              filteredSuppliers={filteredSuppliers}
              loading={loading}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              loadAllData={loadAllData}
              setIsSupplierModalOpen={setIsSupplierModalOpen}
              setProfileModalPartyId={setProfileModalPartyId}
              setProfileModalTab={setProfileModalTab}
              handleDeleteSupplier={handleDeleteSupplier}
              totalSupplierDue={totalSupplierDue}
            />
          }
        />

        <Route path="*" element={<Navigate to="/history" replace />} />
      </Routes>

      {/* All Popups, Guidance Modals & Drawers */}
      <PurchasesModals
        products={products}
        suppliers={suppliers}
        onOpenAddProduct={onOpenAddProduct}
        loadAllData={loadAllData}
        showToast={showToast}
        isOrderModalOpen={isOrderModalOpen}
        setIsOrderModalOpen={setIsOrderModalOpen}
        orderToEdit={orderToEdit}
        setOrderToEdit={setOrderToEdit}
        newlyCreatedSupplier={newlyCreatedSupplier}
        handleOpenAddSupplier={handleOpenAddSupplier}
        isQuotationModalOpen={isQuotationModalOpen}
        setIsQuotationModalOpen={setIsQuotationModalOpen}
        editingQuotation={editingQuotation}
        setEditingQuotation={setEditingQuotation}
        isSupplierModalOpen={isSupplierModalOpen}
        setIsSupplierModalOpen={setIsSupplierModalOpen}
        handleSupplierCreated={handleSupplierCreated}
        isPrintOpen={isPrintOpen}
        setIsPrintOpen={setIsPrintOpen}
        printOrder={printOrder}
        profileModalPartyId={profileModalPartyId}
        setProfileModalPartyId={setProfileModalPartyId}
        profileModalTab={profileModalTab}
        deleteBlockedDialog={deleteBlockedDialog}
        setDeleteBlockedDialog={setDeleteBlockedDialog}
        isOrderDrawerOpen={isOrderDrawerOpen}
        handleCloseOrderDrawer={handleCloseOrderDrawer}
        selectedOrderForDrawer={selectedOrderForDrawer}
        isOrderDrawerLoading={isOrderDrawerLoading}
        handleOpenPrintOrder={handleOpenPrintOrder}
        handleEditOrder={handleEditOrder}
      />
    </div>
  );
}
