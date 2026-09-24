import React from 'react';
import PurchasePrintModal from './PurchasePrintModal';
import PurchaseLedgerPreviewModal from './PurchaseLedgerPreviewModal';
import QuickAddProductModal from './QuickAddProductModal';
import AddSupplierModal from './AddSupplierModal';
import PurchaseSupplierSidebar from '../components/PurchaseSupplierSidebar';
import PurchaseCartItemList from '../components/PurchaseCartItemList';
import PurchaseSummaryAndPayment from '../components/PurchaseSummaryAndPayment';
import {
  usePurchaseCart,
  fullCatalogName,
  productLabel,
  isProductSerialTracked,
  isProductWarrantyRequired,
  EXTRA_COST_CATEGORIES,
  getItemMissingFields,
  computeFinalSale,
  money,
  taka,
} from '../hooks/usePurchaseCart';

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

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-[95vw] max-w-[1100px] max-h-[94vh] flex flex-col shadow-2xl overflow-hidden overflow-x-hidden border border-slate-200">
          {/* Header */}
          <div className="flex justify-between items-center py-4 px-6 border-b border-slate-100 bg-white flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{orderToEdit ? '✏️' : '🛒'}</span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="m-0 text-xl font-extrabold text-slate-900">
                    {orderToEdit
                      ? `Edit Purchase Order #${orderToEdit.po_number || orderToEdit.id}`
                      : 'New Purchase Order'}
                  </h2>
                  {orderToEdit?.has_sales && (
                    <span className="text-[0.72rem] bg-amber-100 text-amber-800 py-0.5 px-2 rounded font-bold border border-amber-200">
                      ⚠️ Sold Items Locked
                    </span>
                  )}
                  {orderToEdit && (
                    <span className="text-[0.72rem] bg-sky-100 text-sky-700 py-0.5 px-2 rounded font-bold">
                      ⏱️ 72h Edit Window
                    </span>
                  )}
                </div>
                <p className="mt-0.5 mb-0 text-xs text-slate-500">
                  {orderToEdit
                    ? 'Prices and barcodes can be updated. Deleting or reducing sold quantities is strictly prohibited.'
                    : 'Procurement, Stock Inward, and Supplier Dues Management'}
                </p>
              </div>
            </div>

            {/* Quick Actions / Emergency Contact */}
            <div className="flex items-center gap-2.5">
              {selectedSupplierObj?.phone && (
                <a
                  href={`tel:${selectedSupplierObj.phone}`}
                  className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-700 text-xs font-semibold no-underline hover:bg-emerald-100 transition-colors"
                  title={`Call supplier: ${selectedSupplierObj.phone}`}
                >
                  <span>📞 Call: {selectedSupplierObj.phone}</span>
                </a>
              )}
              <button
                type="button"
                onClick={onClose}
                className="bg-transparent border-0 text-xl text-slate-500 hover:text-slate-700 cursor-pointer p-1 leading-none"
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

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
              {recoveredDraft && (
                <div className="bg-gradient-to-br from-amber-100 to-amber-50 border-[1.5px] border-amber-500 rounded-xl p-3 px-4 flex items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">⚡</span>
                    <div>
                      <div className="font-extrabold text-sm text-amber-800">
                        Unsaved Purchase Draft Found!
                      </div>
                      <div className="text-xs text-amber-700 mt-0.5">
                        Recovered session with <strong>{recoveredDraft.itemCount} item(s)</strong>{' '}
                        {recoveredDraft.serialCount > 0
                          ? `(${recoveredDraft.serialCount} serial barcodes)`
                          : ''}{' '}
                        saved at {recoveredDraft.formattedTime}.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRestoreDraft}
                      className="bg-amber-600 text-white border-0 py-1.5 px-3.5 rounded-md font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-sm hover:bg-amber-700 transition-colors"
                    >
                      ⚡ Restore Draft
                    </button>
                    <button
                      type="button"
                      onClick={handleDiscardDraft}
                      className="bg-white/80 text-amber-900 border border-amber-300 py-1.5 px-3 rounded-md font-semibold text-xs cursor-pointer hover:bg-white transition-colors"
                    >
                      ✕ Discard
                    </button>
                  </div>
                </div>
              )}

              {/* Supplier Selection Row */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Supplier *
                </label>
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1" ref={supplierSelectRef}>
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                    <input
                      type="text"
                      placeholder="Select Supplier (Search name / phone)"
                      value={
                        selectedSupplierObj
                          ? `${selectedSupplierObj.name}${
                              selectedSupplierObj.phone ? ` (${selectedSupplierObj.phone})` : ''
                            }`
                          : supplierSearch
                      }
                      onFocus={() => setIsSupplierOpen(true)}
                      onChange={(e) => {
                        setSupplierSearch(e.target.value);
                        setIsSupplierOpen(true);
                      }}
                      className="w-full py-2.5 px-9 rounded-lg border-[1.5px] border-slate-300 text-sm text-slate-900 bg-white box-border focus:outline-none focus:border-emerald-500"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <span className="text-xs">⇅</span>
                    </div>
                    {isSupplierOpen && (
                      <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 bg-white border border-slate-300 rounded-lg shadow-xl max-h-[230px] overflow-y-auto">
                        {suppliers
                          .filter((s) => {
                            const q = supplierSearch.trim().toLowerCase();
                            return (
                              !q ||
                              (s.name || '').toLowerCase().includes(q) ||
                              (s.phone || '').toLowerCase().includes(q)
                            );
                          })
                          .map((s) => {
                            const pay = Number(s.payable_balance || 0);
                            const wal = Number(
                              s.wallet_balance !== undefined
                                ? s.wallet_balance
                                : pay < 0
                                ? Math.abs(pay)
                                : 0
                            );
                            const dueTag =
                              pay > 0 ? `Dues: ৳${pay.toLocaleString()}` : '✓ No Dues';
                            const walTag = wal > 0 ? ` · Wallet: ৳${wal.toLocaleString()}` : '';
                            return (
                              <div
                                key={s.id}
                                onMouseDown={() => {
                                  setSupplierId(String(s.id));
                                  setSupplierSearch('');
                                  setIsSupplierOpen(false);
                                }}
                                className={`p-2.5 px-3 cursor-pointer border-b border-slate-100 text-sm text-slate-900 hover:bg-emerald-50 transition-colors ${
                                  String(s.id) === String(supplierId) ? 'bg-blue-50' : 'bg-white'
                                }`}
                              >
                                {s.name} ({dueTag}
                                {walTag})
                              </div>
                            );
                          })}
                        {suppliers.filter((s) => {
                          const q = supplierSearch.trim().toLowerCase();
                          return (
                            !q ||
                            (s.name || '').toLowerCase().includes(q) ||
                            (s.phone || '').toLowerCase().includes(q)
                          );
                        }).length === 0 && (
                          <div className="p-2.5 px-3 text-slate-400 text-xs">
                            No matching supplier
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Inline '+' Button: Triggers popup instead of redirecting */}
                  <button
                    type="button"
                    onClick={() => setIsAddSupplierOpen(true)}
                    className="w-[38px] h-[38px] rounded-lg border-[1.5px] border-slate-300 bg-slate-50 text-sky-600 text-xl font-bold flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors"
                    title="Quick Add Supplier (Popup)"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add Product Search & Inline '+' Popup */}
              <div ref={searchContainerRef} className="relative">
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Add product to order
                </label>
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1 flex items-center">
                    <span className="absolute left-3 text-slate-400">🔍</span>
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setIsSearchOpen(true);
                      }}
                      onFocus={() => {
                        setIsSearchOpen(true);
                      }}
                      placeholder="Search by full catalog name, brand, model, SKU or barcode..."
                      className="w-full py-2.5 px-9 rounded-lg border-[1.5px] border-slate-300 text-sm outline-none focus:border-emerald-500"
                    />
                    <span className="absolute right-3 text-slate-400 pointer-events-none">
                      ⇅
                    </span>
                  </div>

                  {/* Inline '+' Button: Triggers popup instead of redirecting */}
                  <button
                    type="button"
                    onClick={() => setIsAddProductOpen(true)}
                    className="w-[38px] h-[38px] rounded-lg border-[1.5px] border-slate-300 bg-slate-50 text-emerald-500 text-xl font-bold flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors"
                    title="Quick Add Product to Catalog (Popup)"
                  >
                    +
                  </button>

                  <button
                    type="button"
                    onClick={handleAddButtonClick}
                    className="py-2.5 px-4.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white border-0 font-semibold text-sm cursor-pointer flex items-center gap-1.5 whitespace-nowrap transition-colors"
                  >
                    + Add More
                  </button>
                </div>

                {/* Autocomplete dropdown with Full Catalog Name */}
                {isSearchOpen && (
                  <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-[100] bg-white rounded-xl border-[1.5px] border-emerald-500 shadow-2xl max-h-[260px] overflow-y-auto p-1.5">
                    {matches.length === 0 ? (
                      <div className="p-3.5 text-center text-slate-400 text-sm">
                        No matching products found.
                        <div className="mt-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setIsSearchOpen(false);
                              setIsAddProductOpen(true);
                            }}
                            className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md py-1 px-2.5 text-xs font-semibold cursor-pointer hover:bg-emerald-100 transition-colors"
                          >
                            + Create "{query.trim()}" as new product
                          </button>
                        </div>
                      </div>
                    ) : (
                      matches.map((p) => {
                        const fullDesc = fullCatalogName(p);
                        const costHint = Number(
                          p.last_purchase_price || p.purchase_price || p.cost_price || 0
                        );
                        const isAlreadyAdded = items.some((it) => it.product_id === p.id);

                        return (
                          <div
                            key={p.id}
                            onClick={() => {
                              if (isAlreadyAdded) return;
                              addProduct(p);
                              setIsSearchOpen(false);
                            }}
                            className={`py-2 px-3 rounded-md flex justify-between items-center text-sm border-b border-slate-100 transition-colors ${
                              isAlreadyAdded
                                ? 'cursor-not-allowed opacity-45 bg-slate-50'
                                : 'cursor-pointer hover:bg-emerald-50 bg-transparent'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-bold ${
                                    isAlreadyAdded ? 'text-slate-500' : 'text-slate-900'
                                  }`}
                                >
                                  {fullDesc}
                                </span>
                                {isAlreadyAdded && (
                                  <span className="text-[0.68rem] font-bold bg-rose-100 text-rose-700 py-0.5 px-1.5 rounded">
                                    ✓ Already in PO
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 flex gap-2 mt-0.5">
                                <span>SKU: {p.sku || `PRD-${p.id}`}</span>
                                {p.barcode && <span>Barcode: {p.barcode}</span>}
                                {p.category_name && <span>({p.category_name})</span>}
                              </div>
                            </div>
                            <div className="text-right">
                              {isAlreadyAdded ? (
                                <span className="text-xs text-rose-600 font-semibold">
                                  Cannot add twice
                                </span>
                              ) : costHint > 0 ? (
                                <span className="text-xs font-semibold text-sky-600">
                                  Last Cost: {taka(costHint)}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">New Item</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

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
              Save করা যাচ্ছে না
            </div>
            <div className="text-sm text-slate-600 mb-4">{popupMsg}</div>
            <button
              type="button"
              onClick={() => setPopupMsg('')}
              className="py-2 px-6 rounded-lg border-0 bg-slate-900 text-white font-bold text-sm cursor-pointer hover:bg-slate-800 transition-colors"
            >
              ঠিক আছে
            </button>
          </div>
        </div>
      )}
    </>
  );
}
