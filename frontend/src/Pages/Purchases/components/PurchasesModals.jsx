import React from 'react';
import PurchaseOrderModal from '../modals/PurchaseOrderModal';
import PurchaseQuotationModal from '../modals/PurchaseQuotationModal';
import AddSupplierModal from '../modals/AddSupplierModal';
import PurchasePrintModal from '../modals/PurchasePrintModal';
import PartyProfileModal from '../../../components/modals/PartyProfileModal';
import PurchaseDeleteBlockedModal from './PurchaseDeleteBlockedModal';
import PurchaseDetailDrawer from './PurchaseDetailDrawer';

/**
 * All modals & drawer for Purchases & Procurement
 */
export default function PurchasesModals({
  products,
  suppliers,
  onOpenAddProduct,
  loadAllData,
  showToast,

  // Order Modal
  isOrderModalOpen,
  setIsOrderModalOpen,
  orderToEdit,
  setOrderToEdit,
  newlyCreatedSupplier,
  handleOpenAddSupplier,

  // Quotation Modal
  isQuotationModalOpen,
  setIsQuotationModalOpen,
  editingQuotation,
  setEditingQuotation,

  // Supplier Modal
  isSupplierModalOpen,
  setIsSupplierModalOpen,
  handleSupplierCreated,

  // Print Modal
  isPrintOpen,
  setIsPrintOpen,
  printOrder,

  // Party Profile Modal
  profileModalPartyId,
  setProfileModalPartyId,
  profileModalTab,

  // Blocked Delete Modal
  deleteBlockedDialog,
  setDeleteBlockedDialog,

  // Detail Drawer
  isOrderDrawerOpen,
  handleCloseOrderDrawer,
  selectedOrderForDrawer,
  isOrderDrawerLoading,
  handleOpenPrintOrder,
  handleEditOrder,
}) {
  return (
    <>
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
            window.dispatchEvent(new CustomEvent('inventory_stock_changed'));
            window.dispatchEvent(new CustomEvent('data_changed'));
            window.dispatchEvent(new CustomEvent('account_balance_changed'));
            window.dispatchEvent(new CustomEvent('cash_drawer_changed'));
            window.dispatchEvent(new CustomEvent('wallet_balance_changed'));
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

      {/* QUICK-VIEW PURCHASE ORDER DRAWER */}
      <PurchaseDetailDrawer
        isOpen={isOrderDrawerOpen}
        onClose={handleCloseOrderDrawer}
        order={selectedOrderForDrawer}
        loading={isOrderDrawerLoading}
        onPrint={(ord) => {
          handleOpenPrintOrder(ord.id);
        }}
        onEdit={(ord) => {
          handleCloseOrderDrawer();
          handleEditOrder(ord);
        }}
      />
    </>
  );
}
