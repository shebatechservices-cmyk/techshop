import React from 'react';
import { Link, Routes, Route, Navigate } from 'react-router-dom';
import PurchaseOrderModal from './modals/PurchaseOrderModal';
import PurchaseQuotationModal from './modals/PurchaseQuotationModal';
import AddSupplierModal from './modals/AddSupplierModal';
import PurchasePrintModal from './modals/PurchasePrintModal';
import PartyProfileModal from '../../components/modals/PartyProfileModal';
import usePurchaseManager from './hooks/usePurchaseManager';
import PurchaseHistoryTab from './components/PurchaseHistoryTab';
import PurchaseQuotationsTab from './components/PurchaseQuotationsTab';
import PurchaseSuppliersTab from './components/PurchaseSuppliersTab';
import PurchaseDeleteBlockedModal from './components/PurchaseDeleteBlockedModal';

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

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'inherit' }}>
      {/* Toast Notification */}
      {notification.message && (
        <div style={{
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
        }}>
          <span>{notification.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* 1. Consolidated Header, Tabs & Action Buttons in a Single Sleek Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '12px',
          paddingBottom: '8px',
          borderBottom: '1.5px solid #e2e8f0',
        }}
      >
        {/* Left: Compact Title & Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.3rem' }}>🚚</span>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Purchases &amp; Procurement
            </h1>
          </div>
        </div>

        {/* Center: Inline Tab Navigation */}
        <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
          <Link
            to="/history"
            onClick={() => setSearchQuery('')}
            className={`no-underline px-3 py-1.5 rounded-md font-semibold text-xs sm:text-sm cursor-pointer flex items-center gap-1.5 transition-colors ${
              activeTab === 'history'
                ? 'bg-sky-600 text-white font-bold'
                : 'bg-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>Orders</span>
            <span
              className={`px-1.5 py-0.25 rounded-full text-[0.72rem] font-bold ${
                activeTab === 'history'
                  ? 'bg-white/25 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {orders.length}
            </span>
          </Link>

          <Link
            to="/quotations"
            onClick={() => setSearchQuery('')}
            className={`no-underline px-3 py-1.5 rounded-md font-semibold text-xs sm:text-sm cursor-pointer flex items-center gap-1.5 transition-colors ${
              activeTab === 'quotations'
                ? 'bg-indigo-600 text-white font-bold'
                : 'bg-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>Quotations</span>
            <span
              className={`px-1.5 py-0.25 rounded-full text-[0.72rem] font-bold ${
                activeTab === 'quotations'
                  ? 'bg-white/25 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {quotations.length}
            </span>
          </Link>

          <Link
            to="/suppliers"
            onClick={() => setSearchQuery('')}
            className={`no-underline px-3 py-1.5 rounded-md font-semibold text-xs sm:text-sm cursor-pointer flex items-center gap-1.5 transition-colors ${
              activeTab === 'suppliers'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>Suppliers</span>
            <span
              className={`px-1.5 py-0.25 rounded-full text-[0.72rem] font-bold ${
                activeTab === 'suppliers'
                  ? 'bg-white/25 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {suppliers.length}
            </span>
          </Link>
        </div>

        {/* Right: 3 Action Buttons */}
        <div className="flex gap-2 items-center flex-wrap">
          <button
            type="button"
            onClick={() => {
              navigate('/history');
              setIsOrderModalOpen(true);
            }}
            className="bg-sky-600 hover:bg-sky-700 text-white border-0 px-3.5 py-1.5 rounded-md font-bold text-xs sm:text-sm cursor-pointer flex items-center gap-1 shadow-sm transition-colors"
          >
            <span>+</span> Order
          </button>

          <button
            type="button"
            onClick={() => {
              navigate('/quotations');
              setIsQuotationModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 px-3.5 py-1.5 rounded-md font-bold text-xs sm:text-sm cursor-pointer flex items-center gap-1 shadow-sm transition-colors"
          >
            <span>+</span> Quotation
          </button>

          <button
            type="button"
            onClick={() => {
              navigate('/suppliers');
              setIsSupplierModalOpen(true);
            }}
            className="bg-white text-emerald-600 border border-emerald-500 hover:bg-emerald-50 px-3 py-1.5 rounded-md font-bold text-xs sm:text-sm cursor-pointer flex items-center gap-1 transition-colors"
          >
            <span>+</span> Supplier
          </button>
        </div>
      </div>

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

      {/* POPUP MODAL 1: New / Edit Purchase Order */}
      {isOrderModalOpen && (
        <PurchaseOrderModal
          products={products}
          suppliers={suppliers}
          orderToEdit={orderToEdit}
          newlyCreatedSupplier={newlyCreatedSupplier}
          onOpenAddSupplier={handleOpenAddSupplier}
          onOpenAddProduct={onOpenAddProduct}
          onClose={() => {
            setIsOrderModalOpen(false);
            setOrderToEdit(null);
          }}
          onSaved={() => {
            setIsOrderModalOpen(false);
            setOrderToEdit(null);
            loadAllData();
            showToast(orderToEdit ? 'Purchase order updated successfully' : 'Purchase order saved successfully');
          }}
        />
      )}

      {/* POPUP MODAL 2: New Purchase Quotation */}
      {isQuotationModalOpen && (
        <PurchaseQuotationModal
          isOpen={isQuotationModalOpen}
          products={products}
          suppliers={suppliers}
          newlyCreatedSupplier={newlyCreatedSupplier}
          onOpenAddSupplier={handleOpenAddSupplier}
          onOpenAddProduct={onOpenAddProduct}
          editingQuotation={editingQuotation}
          onClose={() => {
            setIsQuotationModalOpen(false);
            setEditingQuotation(null);
          }}
          onQuotationCreated={() => {
            setIsQuotationModalOpen(false);
            setEditingQuotation(null);
            loadAllData();
            showToast(editingQuotation ? 'Purchase quotation updated successfully' : 'Purchase quotation created successfully');
          }}
        />
      )}

      {/* POPUP MODAL 3: Add Supplier */}
      {isSupplierModalOpen && (
        <AddSupplierModal
          isOpen={isSupplierModalOpen}
          onClose={() => setIsSupplierModalOpen(false)}
          onSupplierCreated={handleSupplierCreated}
        />
      )}

      {/* POPUP MODAL 4: Print & Share Invoice */}
      <PurchasePrintModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        order={printOrder}
      />

      {/* POPUP MODAL 5: Supplier Profile Modal */}
      {profileModalPartyId && (
        <PartyProfileModal
          isOpen={Boolean(profileModalPartyId)}
          partyType="supplier"
          partyId={profileModalPartyId}
          initialTab={profileModalTab}
          onClose={() => setProfileModalPartyId(null)}
          onPartyUpdated={() => {
            loadAllData();
          }}
        />
      )}

      {/* REFERENTIAL INTEGRITY BLOCKED DELETE GUIDANCE MODAL */}
      <PurchaseDeleteBlockedModal
        deleteBlockedDialog={deleteBlockedDialog}
        onClose={() => setDeleteBlockedDialog({ isOpen: false, poNumber: '', message: '', linkedInvoices: [] })}
      />
    </div>
  );
}
