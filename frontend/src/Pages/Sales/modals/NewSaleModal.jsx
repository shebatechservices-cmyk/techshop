import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import SalePrintModal from './SalePrintModal';
import AddCustomerModal from './AddCustomerModal';
import SaleCustomerSidebar from '../components/SaleCustomerSidebar';
import SaleProductTable from '../components/SaleProductTable';
import SalePaymentSection from '../components/SalePaymentSection';
import useNewSale from '../hooks/useNewSale';

import NewSaleModalHeader from './new-sale/NewSaleModalHeader';
import NewSaleCustomerSelect from './new-sale/NewSaleCustomerSelect';
import NewSaleProductSearch from './new-sale/NewSaleProductSearch';
import NewSaleFooterActions from './new-sale/NewSaleFooterActions';
import NewSaleSaveBlockPopup from './new-sale/NewSaleSaveBlockPopup';
import NewSaleDraftBanner from './new-sale/NewSaleDraftBanner';
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
  const {
    // States & Refs
    customerId,
    setCustomerId,
    customerSummary,
    items,
    expandedId,
    setExpandedId,
    searchQuery,
    setSearchQuery,
    isSearchOpen,
    setIsSearchOpen,
    searchError,
    setSearchError,
    barcodeInput,
    setBarcodeInput,
    barcodeError,
    setBarcodeError,
    discount,
    setDiscount,
    setDiscountTouched,
    vat,
    setVat,
    hasSetupCharge,
    cameraCount,
    setupRatePerCamera,
    setupCharge,
    hasExtraCost,
    setHasExtraCost,
    extraCost,
    setExtraCost,
    extraCostCategory,
    setExtraCostCategory,
    loyaltyPointsToUse,
    tenders,
    customerSearch,
    setCustomerSearch,
    isCustomerOpen,
    setIsCustomerOpen,
    popupMsg,
    setPopupMsg,
    salesPerson,
    setSalesPerson,
    invoiceDate,
    setInvoiceDate,
    destination,
    setDestination,
    attention,
    setAttention,
    staffList,
    saving,
    error,
    printSale,
    isPrintOpen,
    setIsPrintOpen,
    isPrintPreviewOnly,
    loadingSummary,
    recoveredDraft,
    activeCostCardId,

    // Refs
    searchContainerRef,
    searchInputRef,
    barcodeInputRef,
    customerSelectRef,

    // Computed / Memos
    cashAccounts,
    bankAccounts,
    mfsAccounts,
    walletAccounts,
    filteredProducts,
    subtotal,
    totalDiscount,
    totalSetupCharge,
    totalExtraCost,
    netAmount,
    currentSaleTotal,
    payableAmount,
    selectedCustomer,
    previousDue,
    totalPayable,
    customerWalletBalance,
    customerWalletLabel,
    paid,
    currentDue,
    due,
    customerTypeRaw,
    isTechnician,
    isReseller,
    isGroupCustomer,
    groupDiscountAmount,
    isGroupDiscountActive,

    // Handlers
    toggleCostCard,
    handleRestoreDraft,
    handleDiscardDraft,
    addProduct,
    switchItemUnit,
    updateItem,
    removeItem,
    handleScanEnter,
    handleAddBarcode,
    handleRemoveBarcode,
    handleToggleSetupCharge,
    handleCameraCountChange,
    handleRateChange,
    handleDirectSetupChargeChange,
    handleToggleGroupDiscount,
    updateTender,
    addTenderRow,
    acceptTender,
    cancelTender,
    setQuickPaid,
    handleClearForm,
    handleOpenPrintPreview,
    handlePreviewRecentSale,
    handleSaveSale,
  } = useNewSale({
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
          <div className="p-5 sm:p-6 overflow-y-auto">
            {/* Crash / Draft Recovery Banner */}
            <NewSaleDraftBanner
              recoveredDraft={recoveredDraft}
              handleRestoreDraft={handleRestoreDraft}
              handleDiscardDraft={handleDiscardDraft}
            />

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-sm font-semibold mb-3.5">
                ⚠️ {error}
              </div>
            )}

            {/* Customer Dropdown (searchable) + Quick Add */}
            <NewSaleCustomerSelect
              customers={localCustomers}
              customerId={customerId}
              setCustomerId={setCustomerId}
              selectedCustomer={selectedCustomer}
              customerSearch={customerSearch}
              setCustomerSearch={setCustomerSearch}
              isCustomerOpen={isCustomerOpen}
              setIsCustomerOpen={setIsCustomerOpen}
              customerSelectRef={customerSelectRef}
              onOpenAddCustomer={onOpenAddCustomer}
              setIsAddCustomerOpen={setIsAddCustomerOpen}
            />

            {/* Product Search Bar + Dropdown */}
            <NewSaleProductSearch
              searchContainerRef={searchContainerRef}
              searchInputRef={searchInputRef}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              isSearchOpen={isSearchOpen}
              setIsSearchOpen={setIsSearchOpen}
              searchError={searchError}
              setSearchError={setSearchError}
              handleScanEnter={handleScanEnter}
              filteredProducts={filteredProducts}
              items={items}
              addProduct={addProduct}
              autoFocusEnabled={autoFocusEnabled}
            />

            {/* Top Products Table */}
            <SaleProductTable
              items={items}
              expandedId={expandedId}
              setExpandedId={setExpandedId}
              activeCostCardId={activeCostCardId}
              toggleCostCard={toggleCostCard}
              updateItem={updateItem}
              switchItemUnit={switchItemUnit}
              removeItem={removeItem}
              handleAddBarcode={handleAddBarcode}
              handleRemoveBarcode={handleRemoveBarcode}
              barcodeInput={barcodeInput}
              setBarcodeInput={setBarcodeInput}
              barcodeError={barcodeError}
              setBarcodeError={setBarcodeError}
              barcodeInputRef={barcodeInputRef}
              subtotal={subtotal}
              currentSaleTotal={currentSaleTotal}
            />

            {/* Two-Column Lower Section: ADDITIONAL DETAILS + PAYMENT */}
            <SalePaymentSection
              salesPerson={salesPerson}
              setSalesPerson={setSalesPerson}
              staffList={staffList}
              invoiceDate={invoiceDate}
              setInvoiceDate={setInvoiceDate}
              destination={destination}
              setDestination={setDestination}
              attention={attention}
              setAttention={setAttention}
              paid={paid}
              due={due}
              netAmount={netAmount}
              discount={discount}
              totalDiscount={totalDiscount}
              setDiscount={setDiscount}
              setDiscountTouched={setDiscountTouched}
              loyaltyPointsToUse={loyaltyPointsToUse}
              payableAmount={payableAmount}
              previousDue={previousDue}
              totalPayable={totalPayable}
              currentDue={currentDue}
              vat={vat}
              setVat={setVat}
              hasSetupCharge={hasSetupCharge}
              handleToggleSetupCharge={handleToggleSetupCharge}
              totalSetupCharge={totalSetupCharge}
              cameraCount={cameraCount}
              handleCameraCountChange={handleCameraCountChange}
              setupRatePerCamera={setupRatePerCamera}
              handleRateChange={handleRateChange}
              setupCharge={setupCharge}
              handleDirectSetupChargeChange={handleDirectSetupChargeChange}
              hasExtraCost={hasExtraCost}
              setHasExtraCost={setHasExtraCost}
              extraCost={extraCost}
              setExtraCost={setExtraCost}
              extraCostCategory={extraCostCategory}
              setExtraCostCategory={setExtraCostCategory}
              totalExtraCost={totalExtraCost}
              isTechnician={isTechnician}
              isReseller={isReseller}
              isGroupDiscountActive={isGroupDiscountActive}
              handleToggleGroupDiscount={handleToggleGroupDiscount}
              groupDiscountAmount={groupDiscountAmount}
              setQuickPaid={setQuickPaid}
              tenders={tenders}
              updateTender={updateTender}
              addTenderRow={addTenderRow}
              acceptTender={acceptTender}
              cancelTender={cancelTender}
              cashAccounts={cashAccounts}
              bankAccounts={bankAccounts}
              mfsAccounts={mfsAccounts}
              walletAccounts={walletAccounts}
              customerWalletBalance={customerWalletBalance}
              customerWalletLabel={customerWalletLabel}
            />
          </div>
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
