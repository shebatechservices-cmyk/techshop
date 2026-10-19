import React from 'react';
import PurchaseDraftBanner from '../../components/PurchaseDraftBanner';
import SupplierSearchSection from '../../components/SupplierSearchSection';
import ProductSearchSection from '../../components/ProductSearchSection';
import PurchaseCartItemList from '../../components/PurchaseCartItemList';
import PurchaseOrderPaymentSection from './PurchaseOrderPaymentSection';

export default function PurchaseOrderFormBody({ cart, props }) {
  const {
    orderToEdit = null,
    onClose = () => {},
    onOpenAddProduct,
  } = props;

  const {
    suppliers,
    supplierId,
    setSupplierId,
    query,
    setQuery,
    isSearchOpen,
    setIsSearchOpen,
    items,
    expandedId,
    setExpandedId,
    barcodeInput,
    setBarcodeInput,
    barcodeInputRef,
    searchInputRef,
    searchContainerRef,
    hasExtraCost,
    extraCost,
    extra,
    barcodeScanErrors,
    supplierSearch,
    setSupplierSearch,
    isSupplierOpen,
    setIsSupplierOpen,
    supplierSelectRef,
    recoveredDraft,
    setIsAddSupplierOpen,
    setIsAddProductOpen,
    matches,
    totals,
    selectedSupplierObj,
    handleRestoreDraft,
    handleDiscardDraft,
    updateItem,
    handleItemCostChange,
    handleItemMarginChange,
    addProduct,
    handleAddBarcode,
    handleRemoveBarcode,
    handleRemoveItem,
  } = cart;

  return (
    <main className="flex flex-col gap-4.5 min-w-0">
      {/* Crash / Draft Recovery Banner */}
      <PurchaseDraftBanner
        recoveredDraft={recoveredDraft}
        handleRestoreDraft={handleRestoreDraft}
        handleDiscardDraft={handleDiscardDraft}
      />

      {/* Supplier Selection Row */}
      <SupplierSearchSection
        supplierSelectRef={supplierSelectRef}
        selectedSupplierObj={selectedSupplierObj}
        supplierSearch={supplierSearch}
        setSupplierSearch={setSupplierSearch}
        isSupplierOpen={isSupplierOpen}
        setIsSupplierOpen={setIsSupplierOpen}
        suppliers={suppliers}
        supplierId={supplierId}
        setSupplierId={setSupplierId}
        setIsAddSupplierOpen={setIsAddSupplierOpen}
      />

      {/* Add Product Search & Inline '+' Popup */}
      <ProductSearchSection
        searchContainerRef={searchContainerRef}
        searchInputRef={searchInputRef}
        query={query}
        setQuery={setQuery}
        isSearchOpen={isSearchOpen}
        setIsSearchOpen={setIsSearchOpen}
        matches={matches}
        addProduct={addProduct}
        items={items}
        setIsAddProductOpen={setIsAddProductOpen}
        onClose={onClose}
        onOpenAddProduct={onOpenAddProduct}
      />

      {/* Product Items List Component */}
      <PurchaseCartItemList
        items={items}
        expandedId={expandedId}
        setExpandedId={setExpandedId}
        barcodeInput={barcodeInput}
        setBarcodeInput={setBarcodeInput}
        barcodeInputRef={barcodeInputRef}
        barcodeScanErrors={barcodeScanErrors}
        updateItem={updateItem}
        handleItemCostChange={handleItemCostChange}
        handleItemMarginChange={handleItemMarginChange}
        handleAddBarcode={handleAddBarcode}
        handleRemoveBarcode={handleRemoveBarcode}
        handleRemoveItem={handleRemoveItem}
        totalGoodsCost={totals?.cost || 0}
        extraCostValue={hasExtraCost ? (typeof extra === 'number' ? extra : Number(extraCost || 0)) : 0}
      />

      {/* Bottom Section: Summary & Payment Component */}
      <PurchaseOrderPaymentSection
        cart={cart}
        orderToEdit={orderToEdit}
        onClose={onClose}
      />
    </main>
  );
}
