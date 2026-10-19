import React from 'react';
import NewSaleDraftBanner from './NewSaleDraftBanner';
import NewSaleCustomerSelect from './NewSaleCustomerSelect';
import NewSaleProductSearch from './NewSaleProductSearch';
import SaleProductTable from '../../components/SaleProductTable';

export default function NewSaleItemsSection({
  saleState,
  localCustomers,
  onOpenAddCustomer,
  setIsAddCustomerOpen,
  autoFocusEnabled,
}) {
  const {
    customerId,
    setCustomerId,
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
    customerSearch,
    setCustomerSearch,
    isCustomerOpen,
    setIsCustomerOpen,
    error,
    recoveredDraft,
    activeCostCardId,
    searchContainerRef,
    searchInputRef,
    barcodeInputRef,
    customerSelectRef,
    filteredProducts,
    subtotal,
    currentSaleTotal,
    selectedCustomer,
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
  } = saleState;

  return (
    <>
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
    </>
  );
}
