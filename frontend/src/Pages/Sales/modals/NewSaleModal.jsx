import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import SalePrintModal from './SalePrintModal';
import AddCustomerModal from './AddCustomerModal';
import SaleCustomerSidebar from '../components/SaleCustomerSidebar';
import SaleProductTable from '../components/SaleProductTable';
import SalePaymentSection from '../components/SalePaymentSection';
import { fullCatalogName } from '../../../utils/productUtils';
import useNewSale, { taka } from '../hooks/useNewSale';

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
    customers,
    products,
    newlyCreatedCustomer,
    onOpenAddCustomer,
    onSaleCreated,
    editSale,
    onSaleUpdated,
  });

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[50000] bg-slate-900/75 flex items-center justify-center p-4 backdrop-blur-[3px]">
      <div className="bg-slate-50 rounded-2xl w-[min(1180px,calc(100vw-32px))] max-h-[calc(100vh-32px)] shadow-2xl overflow-hidden grid grid-rows-[auto_minmax(0,1fr)_auto]">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl text-gray-500">{editSale ? '✏️' : '🛒'}</span>
            <div>
              <h3 className="m-0 text-lg font-bold text-gray-900">
                {editSale ? `Edit Sale Invoice #${editSale.invoice_no || editSale.id}` : 'New POS Sale & Invoice'}
              </h3>
              <p className="m-0 text-xs text-gray-500 mt-0.5">
                {editSale
                  ? 'Editing is only allowed within 7 days of the original sale. Stock, serials & payments are re-settled automatically.'
                  : 'Instant point of sale, barcode scanning, loyalty points, and multi-tender payments'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
            title="Close modal"
          >
            ✕
          </button>
        </div>

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
            {recoveredDraft && (
              <div className="bg-gradient-to-br from-amber-100 to-amber-50 border-[1.5px] border-amber-500 rounded-xl p-3 sm:px-4 mb-4 flex items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <div className="font-extrabold text-sm text-amber-900">
                      Unsaved Sales Draft Found!
                    </div>
                    <div className="text-xs text-amber-800 mt-0.5">
                      Recovered session with <strong>{recoveredDraft.itemCount} item(s)</strong> {recoveredDraft.serialCount > 0 ? `(${recoveredDraft.serialCount} serial barcodes)` : ''} saved at {recoveredDraft.formattedTime}.
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRestoreDraft}
                    className="bg-amber-600 hover:bg-amber-700 text-white border-0 py-1.5 px-3.5 rounded-md font-bold text-xs cursor-pointer flex items-center gap-1 shadow-sm transition-colors"
                  >
                    ⚡ Restore Draft
                  </button>
                  <button
                    type="button"
                    onClick={handleDiscardDraft}
                    className="bg-white/80 hover:bg-white text-amber-900 border border-amber-300 py-1.5 px-3 rounded-md font-semibold text-xs cursor-pointer transition-colors"
                  >
                    ✕ Discard
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-sm font-semibold mb-3.5">
                ⚠️ {error}
              </div>
            )}

            {/* Customer Dropdown (searchable) + Quick Add */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-bold text-slate-600 min-w-[70px]">Customer</span>
              <div className="relative flex-1" ref={customerSelectRef}>
                <input
                  type="text"
                  placeholder="🔍 Select Customer (Search name / phone)"
                  value={selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.phone || ''})` : customerSearch}
                  onFocus={() => setIsCustomerOpen(true)}
                  onChange={(e) => { setCustomerSearch(e.target.value); setIsCustomerOpen(true); }}
                  className="w-full py-2 px-3 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:border-emerald-500 box-border"
                />
                {isCustomerOpen && (
                  <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 bg-white border border-slate-300 rounded-lg shadow-xl max-h-[220px] overflow-y-auto">
                    {customers
                      .filter((c) => {
                        const q = customerSearch.trim().toLowerCase();
                        return !q || (c.name || '').toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q);
                      })
                      .map((c) => {
                        const grp = (c.customer_type || c.customer_group || '').toLowerCase();
                        const tag = grp.includes('tech') ? ' [🔧 Technician - 5% Off]' : grp.includes('resell') || grp === 'wholesale' ? ' [🏪 Reseller]' : '';
                        return (
                          <div
                            key={c.id}
                            onMouseDown={() => { setCustomerId(String(c.id)); setCustomerSearch(''); setIsCustomerOpen(false); }}
                            className={`py-2 px-3 cursor-pointer border-b border-slate-100 text-sm text-slate-900 transition-colors ${
                              String(c.id) === String(customerId) ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'
                            }`}
                          >
                            {c.name} ({c.phone}){tag} <span className="text-slate-400">• Due: ৳{Number(c.receivable_balance || 0).toLocaleString()}</span>
                          </div>
                        );
                      })}
                    {customers.filter((c) => {
                      const q = customerSearch.trim().toLowerCase();
                      return !q || (c.name || '').toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q);
                    }).length === 0 && (
                      <div className="p-3 text-slate-400 text-xs">No matching customer</div>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (onOpenAddCustomer) {
                    onOpenAddCustomer();
                  } else {
                    setIsAddCustomerOpen(true);
                  }
                }}
                className="py-2 px-3.5 rounded-lg border-[1.5px] border-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold text-sm cursor-pointer whitespace-nowrap transition-colors"
              >
                + Add Customer
              </button>
            </div>

            {/* Product Search Bar + Dropdown */}
            <div ref={searchContainerRef} className="relative mb-4">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (searchError) setSearchError('');
                  setIsSearchOpen(true);
                }}
                onKeyDown={handleScanEnter}
                placeholder="🔍 Scan barcode or search products by name, SKU, brand to add..."
                className="w-full py-2.5 px-3.5 rounded-lg border-[1.5px] border-emerald-600 text-sm outline-none bg-white box-border focus:ring-2 focus:ring-emerald-200"
              />

              {/* Floating Dropdown */}
              {isSearchOpen && filteredProducts.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-slate-300 rounded-xl shadow-2xl max-h-[260px] overflow-y-auto p-1.5">
                  {filteredProducts.map((prod) => {
                    const isAdded = items.some((it) => it.product_id === prod.id);
                    return (
                      <div
                        key={prod.id}
                        onClick={() => addProduct(prod)}
                        className={`flex justify-between items-center py-2 px-3 rounded-md cursor-pointer text-sm transition-colors ${
                          isAdded ? 'bg-emerald-50' : 'hover:bg-slate-100 bg-transparent'
                        }`}
                      >
                        <div>
                          <strong className="text-slate-900">{fullCatalogName(prod)}</strong>
                          <span className="text-xs text-slate-500 ml-2">
                            SKU: {prod.sku || 'N/A'} · Stock: {prod.stock || 0}
                          </span>
                          {Number(prod.stock || 0) <= 0 && (
                            <span className="text-[0.7rem] text-rose-700 font-bold ml-2">
                              Out of stock
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-600">
                            {taka(prod.sale_price ?? prod.salePrice ?? prod.selling_price ?? prod.purchase_price ?? 0)}
                          </span>
                          {isAdded && (
                            <span className="text-[0.72rem] text-emerald-600 font-bold bg-emerald-100 py-0.5 px-1.5 rounded">
                              ✓ Added
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {searchError && (
                <div className="mt-1.5 py-2 px-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-semibold">
                  ⚠️ {searchError}
                </div>
              )}
            </div>

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
        <div className="py-3.5 px-6 bg-white border-t border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={handleClearForm}
              className="py-2 px-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-rose-600 text-sm font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-colors"
            >
              🗑️ Clear Form
            </button>
            <div className="text-xs text-slate-500">
              <span>{items.length} Items</span> · <span>Payable: <strong className="text-slate-900">{taka(totalPayable)}</strong></span> · <span>Paid: <strong className="text-emerald-600">{taka(paid)}</strong></span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleOpenPrintPreview}
              className="py-2 px-4 rounded-lg border-[1.5px] border-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-sm font-bold cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              🖨️ Print Preview
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 text-sm font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveSale}
              className="py-2 px-6 rounded-lg border-0 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold cursor-pointer shadow-md transition-colors disabled:opacity-50"
            >
              {saving
                ? 'Saving...'
                : editSale && editSale.id
                ? '✓ Edit Save & Preview'
                : '✓ Save & Preview'}
            </button>
          </div>
        </div>
      </div>

      {/* Save-block popup (customer / payment) */}
      {popupMsg && (
        <div
          className="fixed inset-0 z-[100001] bg-slate-900/55 backdrop-blur-[2px] flex items-center justify-center p-5"
          onClick={() => setPopupMsg('')}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-3xl mb-1.5">⚠️</div>
            <div className="font-extrabold text-base text-slate-900 mb-1.5">
              Unable to Save
            </div>
            <div className="text-sm text-slate-600 mb-4">{popupMsg}</div>
            <button
              type="button"
              onClick={() => setPopupMsg('')}
              className="py-2 px-6 rounded-lg border-0 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm cursor-pointer transition-colors"
            >
              OK, Got It
            </button>
          </div>
        </div>
      )}

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
