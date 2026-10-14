import React from 'react';
import SalePrintModal from './SalePrintModal';
import useSaleQuotation from '../hooks/useSaleQuotation';
import QuotationModalHeader from './quotation/QuotationModalHeader';
import QuotationCustomerMeta from './quotation/QuotationCustomerMeta';
import QuotationProductSearch from './quotation/QuotationProductSearch';
import QuotationItemsTable from './quotation/QuotationItemsTable';
import QuotationFinancialSummary from './quotation/QuotationFinancialSummary';
import QuotationFooterActions from './quotation/QuotationFooterActions';

export default function SaleQuotationModal({
  isOpen,
  onClose,
  customers = [],
  products = [],
  newlyCreatedCustomer,
  onOpenAddCustomer,
  onQuotationCreated,
  editingQuotation = null,
  initialProduct = null,
}) {
  const {
    customerId,
    customerName,
    setCustomerName,
    validUntil,
    setValidUntil,
    notes,
    setNotes,
    items,
    searchQuery,
    setSearchQuery,
    isSearchOpen,
    setIsSearchOpen,
    discount,
    setDiscount,
    vat,
    setVat,
    saving,
    error,
    printQuotation,
    isPrintOpen,
    setIsPrintOpen,
    searchContainerRef,
    customerList,
    filteredProducts,
    subtotal,
    grandTotal,
    handleCustomerChange,
    handleAddItem,
    handleUpdateItem,
    handleRemoveItem,
    handleOpenPrintPreview,
    handleSaveQuotation,
  } = useSaleQuotation({
    isOpen,
    customers,
    products,
    newlyCreatedCustomer,
    editingQuotation,
    initialProduct,
    onQuotationCreated,
  });

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Modal Header */}
        <QuotationModalHeader onClose={onClose} />

        {/* Modal Body */}
        <form onSubmit={handleSaveQuotation} style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Customer & Quote Meta Card */}
          <QuotationCustomerMeta
            customerId={customerId}
            customers={customerList}
            customerName={customerName}
            validUntil={validUntil}
            onCustomerChange={handleCustomerChange}
            onCustomerNameChange={setCustomerName}
            onValidUntilChange={setValidUntil}
            onOpenAddCustomer={onOpenAddCustomer}
          />

          {/* Product Search & Dropdown */}
          <QuotationProductSearch
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isSearchOpen={isSearchOpen}
            onSearchFocus={() => setIsSearchOpen(true)}
            filteredProducts={filteredProducts}
            onAddItem={handleAddItem}
            searchContainerRef={searchContainerRef}
          />

          {/* Quotation Items Table */}
          <QuotationItemsTable
            items={items}
            onUpdateItem={handleUpdateItem}
            onRemoveItem={handleRemoveItem}
          />

          {/* Notes & Financial Breakdown Grid */}
          <QuotationFinancialSummary
            notes={notes}
            onNotesChange={setNotes}
            subtotal={subtotal}
            discount={discount}
            onDiscountChange={setDiscount}
            vat={vat}
            onVatChange={setVat}
            grandTotal={grandTotal}
          />

          {/* Footer Buttons */}
          <QuotationFooterActions
            onOpenPrintPreview={handleOpenPrintPreview}
            onClose={onClose}
            saving={saving}
            editingQuotation={editingQuotation}
          />
        </form>
      </div>

      {/* Quotation Print Modal */}
      <SalePrintModal
        isOpen={isPrintOpen}
        onClose={() => {
          setIsPrintOpen(false);
          if (printQuotation && printQuotation.id !== 'DRAFT') {
            onClose();
          }
        }}
        sale={printQuotation}
        isQuotation={true}
      />
    </div>
  );
}
