import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import SalePrintModal from './SalePrintModal';
import AddCustomerModal from './AddCustomerModal';
import SaleCustomerSidebar from '../components/SaleCustomerSidebar';
import useNewSale from '../hooks/useNewSale';

import NewSaleModalHeader from './new-sale/NewSaleModalHeader';
import NewSaleFormBody from './new-sale/NewSaleFormBody';
import NewSaleFooterActions from './new-sale/NewSaleFooterActions';
import NewSaleSaveBlockPopup from './new-sale/NewSaleSaveBlockPopup';
import usePosShortcuts from './new-sale/usePosShortcuts';

export default function NewSaleModal({
  isOpen,
  onClose,
  customers = [],
  products = [],
  newlyCreatedCustomer,
  onOpenAddCustomer,
  onCustomerCreated,
  onSaleCreated,
  editSale = null,
  onSaleUpdated = null,
}) {
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [localCustomers, setLocalCustomers] = useState(Array.isArray(customers) ? customers : []);

  useEffect(() => {
    if (Array.isArray(customers) && customers.length > 0) {
      setLocalCustomers(customers);
    }
  }, [customers]);

  useEffect(() => {
    const handleCustomerCreated = (e) => {
      const created = e.detail;
      if (created && created.id) {
        setLocalCustomers((prev) => [created, ...prev.filter((c) => c.id !== created.id)]);
      }
    };
    window.addEventListener('customer_created', handleCustomerCreated);
    return () => window.removeEventListener('customer_created', handleCustomerCreated);
  }, []);

  const saleState = useNewSale({
    isOpen,
    onClose,
    customers: localCustomers,
    products,
    newlyCreatedCustomer,
    onOpenAddCustomer,
    onSaleCreated,
    editSale,
    onSaleUpdated,
  });

  const {
    saving,
    items,
    handleSaveSale,
    isSearchOpen,
    isCustomerOpen,
    setIsSearchOpen,
    setIsCustomerOpen,
    searchInputRef,
    customerSelectRef,
    selectedCustomer,
    customerTypeRaw,
    isGroupCustomer,
    isGroupDiscountActive,
    previousDue,
    customerWalletBalance,
    customerSummary,
    loadingSummary,
    handleToggleGroupDiscount,
    handlePreviewRecentSale,
    totalPayable,
    paid,
    handleClearForm,
    handleOpenPrintPreview,
    popupMsg,
    setPopupMsg,
    printSale,
    isPrintOpen,
    setIsPrintOpen,
    isPrintPreviewOnly,
    setCustomerId,
    setCustomerSearch,
  } = saleState;

  // Auto-Focus toggle state and keyboard shortcuts
  const { autoFocusEnabled, toggleAutoFocus } = usePosShortcuts({
    isOpen,
    saving,
    items,
    handleSaveSale,
    isSearchOpen,
    isCustomerOpen,
    setIsSearchOpen,
    setIsCustomerOpen,
    searchInputRef,
    customerSelectRef,
  });

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[50000] bg-slate-900/75 flex items-center justify-center p-4 backdrop-blur-[3px]">
      <div className="bg-slate-50 rounded-2xl w-[min(1180px,calc(100vw-32px))] max-h-[calc(100vh-32px)] shadow-2xl overflow-hidden grid grid-rows-[auto_minmax(0,1fr)_auto]">
        {/* Header */}
        <NewSaleModalHeader
          editSale={editSale}
          autoFocusEnabled={autoFocusEnabled}
          toggleAutoFocus={toggleAutoFocus}
          onClose={onClose}
        />

        {/* Main Grid: Sidebar + Form Content */}
        <div className="grid grid-cols-[260px_minmax(0,1fr)] min-h-0 overflow-hidden">
          {/* Customer Sidebar */}
          <SaleCustomerSidebar
            selectedCustomer={selectedCustomer}
            customerTypeRaw={customerTypeRaw}
            isGroupCustomer={isGroupCustomer}
            isGroupDiscountActive={isGroupDiscountActive}
            previousDue={previousDue}
            customerWalletBalance={customerWalletBalance}
            customerSummary={customerSummary}
            loadingSummary={loadingSummary}
            handleToggleGroupDiscount={handleToggleGroupDiscount}
            handlePreviewRecentSale={handlePreviewRecentSale}
          />

          {/* POS Body */}
          <NewSaleFormBody
            saleState={saleState}
            localCustomers={localCustomers}
            onOpenAddCustomer={onOpenAddCustomer}
            setIsAddCustomerOpen={setIsAddCustomerOpen}
            autoFocusEnabled={autoFocusEnabled}
          />
        </div>

        {/* Footer Actions */}
        <NewSaleFooterActions
          items={items}
          totalPayable={totalPayable}
          paid={paid}
          saving={saving}
          editSale={editSale}
          handleClearForm={handleClearForm}
          handleOpenPrintPreview={handleOpenPrintPreview}
          handleSaveSale={handleSaveSale}
          onClose={onClose}
        />
      </div>

      {/* Save-block popup (customer / payment) */}
      <NewSaleSaveBlockPopup popupMsg={popupMsg} setPopupMsg={setPopupMsg} />

      {/* Invoice Print & Share Modal */}
      <SalePrintModal
        isOpen={isPrintOpen}
        onClose={() => {
          setIsPrintOpen(false);
          if (!isPrintPreviewOnly && printSale && printSale.id !== 'DRAFT') {
            onClose();
          }
        }}
        sale={printSale}
        isQuotation={false}
      />

      {/* Embedded Add Customer Modal for New Sale POS */}
      {isAddCustomerOpen && (
        <AddCustomerModal
          isOpen={isAddCustomerOpen}
          onClose={() => setIsAddCustomerOpen(false)}
          onCustomerCreated={(newCust) => {
            setIsAddCustomerOpen(false);
            if (newCust && newCust.id) {
              setLocalCustomers((prev) => [newCust, ...prev.filter((c) => c.id !== newCust.id)]);
              setCustomerId(String(newCust.id));
              setCustomerSearch('');
              setIsCustomerOpen(false);
            }
            if (onCustomerCreated) {
              onCustomerCreated(newCust);
            }
          }}
        />
      )}
    </div>,
    document.body
  );
}
