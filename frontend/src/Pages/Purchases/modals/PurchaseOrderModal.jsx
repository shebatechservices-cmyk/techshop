import React from 'react';
import PurchasePrintModal from './PurchasePrintModal';
import PurchaseLedgerPreviewModal from './PurchaseLedgerPreviewModal';
import QuickAddProductModal from './QuickAddProductModal';
import AddSupplierModal from './AddSupplierModal';
import PurchaseSupplierSidebar from '../components/PurchaseSupplierSidebar';
import PurchaseCartItemList from '../components/PurchaseCartItemList';
import PurchaseSummaryAndPayment from '../components/PurchaseSummaryAndPayment';
import PurchaseOrderHeader from '../components/PurchaseOrderHeader';
import PurchaseDraftBanner from '../components/PurchaseDraftBanner';
import SupplierSearchSection from '../components/SupplierSearchSection';
import ProductSearchSection from '../components/ProductSearchSection';
import { usePurchaseCart } from '../hooks/usePurchaseCart';

export default function PurchaseOrderModal(props) {
  const {
    isOpen = true,
    orderToEdit = null,
    onClose = () => {},
  } = props;

  const {
    productList,
    setProductList,
    suppliers,
    setSuppliers,
    accounts,
    setAccounts,
    supplierId,
    setSupplierId,
    summary,
    setSummary,
    query,
    setQuery,
    isSearchOpen,
    setIsSearchOpen,
    items,
    setItems,
    expandedId,
    setExpandedId,
    barcodeInput,
    setBarcodeInput,
    barcodeInputRef,
    searchInputRef,
    searchContainerRef,
    reference,
    setReference,
    hasExtraCost,
    setHasExtraCost,
    extraCost,
    setExtraCost,
    extraCostCategory,
    setExtraCostCategory,
    extraCostNotes,
    setExtraCostNotes,
    discount,
    setDiscount,
    tenders,
    setTenders,
    paymentConfirmed,
    setPaymentConfirmed,
    barcodeScanErrors,
    setBarcodeScanErrors,
    supplierSearch,
    setSupplierSearch,
    isSupplierOpen,
    setIsSupplierOpen,
    supplierSelectRef,
    printOrder,
    setPrintOrder,
    isPrintOpen,
    setIsPrintOpen,
    isPrintPreviewOnly,
    setIsPrintPreviewOnly,
    recoveredDraft,
    setRecoveredDraft,
    isAddSupplierOpen,
    setIsAddSupplierOpen,
    isAddProductOpen,
    setIsAddProductOpen,
    previewOrderId,
    setPreviewOrderId,
    previewOrderData,
    setPreviewOrderData,
    isLedgerPreviewOpen,
    setIsLedgerPreviewOpen,
    error,
    setError,
    popupMsg,
    setPopupMsg,
    saving,
    setSaving,
    walletAccounts,
    setWalletAccounts,
    cashAccounts,
    bankAccounts,
    mfsAccounts,
    accountByLabel,
    accountLabelToId,
    accountLabelToBalance,
    matches,
    totals,
    extra,
    netAmount,
    payableAmount,
    totalCost,
    totalSale,
    estimatedProfit,
    selectedSupplierObj,
    supplierPayable,
    previousDue,
    totalPayable,
    supplierWallet,
    supplierWalletLabel,
    acceptedPaid,
    paid,
    currentDue,
    remainingDue,
    handleRestoreDraft,
    handleDiscardDraft,
    updateItem,
    handleItemCostChange,
    handleItemMarginChange,
    handleItemSaleChange,
    addProduct,
    handleAddBarcode,
    handleRemoveBarcode,
    handleRemoveItem,
    handleAddButtonClick,
    updateTender,
    removeTender,
    addTenderRow,
    acceptTender,
    cancelTender,
    handlePayFull,
    handleFullDue,
    handleClearForm,
    handleLoadOrderInForm,
    handleOpenRecentPreview,
    savePurchase,
  } = usePurchaseCart(props);

  React.useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchContainerRef?.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
      if (supplierSelectRef?.current && !supplierSelectRef.current.contains(e.target)) {
        setIsSupplierOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [searchContainerRef, supplierSelectRef, setIsSearchOpen, setIsSupplierOpen]);

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-[95vw] max-w-[1100px] max-h-[94vh] flex flex-col shadow-2xl overflow-hidden overflow-x-hidden border border-slate-200">
          {/* Header */}
          <PurchaseOrderHeader
            orderToEdit={orderToEdit}
            items={items}
            selectedSupplierObj={selectedSupplierObj}
            onClose={onClose}
          />

          {/* Modal Body - 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-[290px_1fr] flex-1 overflow-y-auto py-5 px-6 gap-6">
            {/* Left Column: Supplier Profile Card & Recent Purchases */}
            <PurchaseSupplierSidebar
              selectedSupplierObj={selectedSupplierObj}
              supplierPayable={supplierPayable}
              summary={summary}
              handleOpenRecentPreview={handleOpenRecentPreview}
            />

            {/* Right Column: Main Form */}
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
              />

              {/* Bottom Section: Summary & Payment Component */}
              <PurchaseSummaryAndPayment
                hasExtraCost={hasExtraCost}
                setHasExtraCost={setHasExtraCost}
                extraCost={extraCost}
                setExtraCost={setExtraCost}
                extraCostCategory={extraCostCategory}
                setExtraCostCategory={setExtraCostCategory}
                reference={reference}
                setReference={setReference}
                extra={extra}
                netAmount={netAmount}
                discount={discount}
                setDiscount={setDiscount}
                payableAmount={payableAmount}
                previousDue={previousDue}
                totalPayable={totalPayable}
                currentDue={currentDue}
                handlePayFull={handlePayFull}
                handleFullDue={handleFullDue}
                tenders={tenders}
                updateTender={updateTender}
                addTenderRow={addTenderRow}
                acceptTender={acceptTender}
                cancelTender={cancelTender}
                cashAccounts={cashAccounts}
                bankAccounts={bankAccounts}
                mfsAccounts={mfsAccounts}
                walletAccounts={walletAccounts}
                supplierWallet={supplierWallet}
                supplierWalletLabel={supplierWalletLabel}
                error={error}
                items={items}
                totals={totals}
                totalCost={totalCost}
                paid={paid}
                remainingDue={remainingDue}
                estimatedProfit={estimatedProfit}
                handleClearForm={handleClearForm}
                onClose={onClose}
                savePurchase={savePurchase}
                saving={saving}
                orderToEdit={orderToEdit}
              />
            </main>
          </div>
        </div>
      </div>

      {/* Inline Quick Add Supplier Modal */}
      {isAddSupplierOpen && (
        <AddSupplierModal
          isOpen={isAddSupplierOpen}
          onClose={() => setIsAddSupplierOpen(false)}
          onSupplierAdded={(newSup) => {
            if (newSup && newSup.id) {
              setSuppliers((prev) => [newSup, ...prev.filter((s) => s.id !== newSup.id)]);
              setSupplierId(String(newSup.id));
            }
            setIsAddSupplierOpen(false);
          }}
        />
      )}

      {/* Inline Quick Add Product to Catalog Modal with duplicate checking */}
      {isAddProductOpen && (
        <QuickAddProductModal
          isOpen={isAddProductOpen}
          onClose={() => setIsAddProductOpen(false)}
          existingProducts={productList}
          onProductCreated={(createdProd) => {
            if (createdProd && createdProd.id) {
              setProductList((prev) => [createdProd, ...prev]);
              addProduct(createdProd);
            }
            setIsAddProductOpen(false);
          }}
        />
      )}

      {/* Recent PO Ledger Preview Modal with Voucher view, Open in Purchase Form, Print, and Share */}
      {isLedgerPreviewOpen && (
        <PurchaseLedgerPreviewModal
          isOpen={isLedgerPreviewOpen}
          onClose={() => setIsLedgerPreviewOpen(false)}
          orderId={previewOrderId}
          purchaseOrderId={previewOrderId}
          initialOrder={previewOrderData}
          purchaseOrderData={previewOrderData}
          onOpenInPurchaseForm={(po) => handleLoadOrderInForm(po)}
          onLoadInForm={(po) => handleLoadOrderInForm(po)}
          onOpenPrint={(po) => {
            setPrintOrder(po);
            setIsPrintPreviewOnly(true);
            setIsPrintOpen(true);
            setIsLedgerPreviewOpen(false);
          }}
        />
      )}

      {/* Print / Voucher Modal */}
      {isPrintOpen && (
        <PurchasePrintModal
          isOpen={isPrintOpen}
          order={printOrder}
          supplier={selectedSupplierObj}
          onClose={() => {
            setIsPrintOpen(false);
            if (!isPrintPreviewOnly) {
              onClose();
            }
          }}
        />
      )}

      {/* Save-block popup (supplier / payment) */}
      {popupMsg && (
        <div
          className="fixed inset-0 z-[100001] bg-slate-900/55 backdrop-blur-sm flex items-center justify-center p-5"
          onClick={() => setPopupMsg('')}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-[420px] w-full shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-3xl mb-1.5">⚠️</div>
            <div className="font-extrabold text-base text-slate-900 mb-1.5">
              Unable to Save Purchase
            </div>
            <div className="text-sm text-slate-600 mb-4">{popupMsg}</div>
            <button
              type="button"
              onClick={() => setPopupMsg('')}
              className="py-2 px-6 rounded-lg border-0 bg-slate-900 text-white font-bold text-sm cursor-pointer hover:bg-slate-800 transition-colors"
            >
              OK, Understood
            </button>
          </div>
        </div>
      )}
    </>
  );
}
