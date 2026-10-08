import React from 'react';
import useSaleExchangeState from './exchange/useSaleExchangeState';
import ExchangeReturnItemsTable from './exchange/ExchangeReturnItemsTable';
import ExchangeReplacementItemsTable from './exchange/ExchangeReplacementItemsTable';
import ExchangeSettlementSummary from './exchange/ExchangeSettlementSummary';

export default function SaleExchangeModal({
  isOpen,
  onClose,
  saleId,
  products = [],
  onExchangeComplete,
}) {
  const {
    loading,
    error,
    originalSale,
    returnItems,
    setReturnItems,
    newItems,
    expandedId,
    setExpandedId,
    searchQuery,
    setSearchQuery,
    isSearchOpen,
    setIsSearchOpen,
    barcodeInput,
    setBarcodeInput,
    paidAmount,
    setPaidAmount,
    paymentMethod,
    setPaymentMethod,
    processing,
    searchContainerRef,
    searchInputRef,
    filteredProducts,
    addNewProduct,
    updateNewItem,
    removeNewItem,
    handleAddBarcode,
    handleRemoveBarcode,
    returnSubtotal,
    newSubtotal,
    netDifference,
    handleSubmitExchange,
  } = useSaleExchangeState({
    isOpen,
    saleId,
    products,
    onExchangeComplete,
    onClose,
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
          background: '#f8fafc',
          borderRadius: '16px',
          width: 'min(1100px, calc(100vw - 32px))',
          maxHeight: 'calc(100vh - 32px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateRows: 'auto minmax(0, 1fr) auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            background: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>🔄</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                Sale Product Exchange
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#c7d2fe' }}>
                {originalSale
                  ? `Exchanging items from Invoice #${originalSale.invoice_no} (${originalSale.customer_name})`
                  : 'Loading invoice...'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#fff',
              fontSize: '1.2rem',
              cursor: 'grid',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          {error && (
            <div
              style={{
                padding: '10px 14px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#b91c1c',
                fontSize: '0.88rem',
                fontWeight: 600,
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {loading ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px',
                color: '#64748b',
              }}
            >
              Loading sale details...
            </div>
          ) : (
            <>
              {/* SECTION 1: ITEMS TO RETURN */}
              <ExchangeReturnItemsTable
                returnItems={returnItems}
                setReturnItems={setReturnItems}
                returnSubtotal={returnSubtotal}
              />

              {/* SECTION 2: REPLACEMENT / NEW PRODUCTS */}
              <ExchangeReplacementItemsTable
                newItems={newItems}
                newSubtotal={newSubtotal}
                searchContainerRef={searchContainerRef}
                searchInputRef={searchInputRef}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                isSearchOpen={isSearchOpen}
                setIsSearchOpen={setIsSearchOpen}
                filteredProducts={filteredProducts}
                addNewProduct={addNewProduct}
                expandedId={expandedId}
                setExpandedId={setExpandedId}
                barcodeInput={barcodeInput}
                setBarcodeInput={setBarcodeInput}
                handleAddBarcode={handleAddBarcode}
                handleRemoveBarcode={handleRemoveBarcode}
                updateNewItem={updateNewItem}
                removeNewItem={removeNewItem}
              />

              {/* SECTION 3: RECONCILIATION SUMMARY */}
              <ExchangeSettlementSummary
                returnSubtotal={returnSubtotal}
                newSubtotal={newSubtotal}
                netDifference={netDifference}
                paidAmount={paidAmount}
                setPaidAmount={setPaidAmount}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
              />
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            background: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#475569',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmitExchange}
            disabled={processing || loading}
            style={{
              padding: '8px 24px',
              borderRadius: '8px',
              border: 'none',
              background: '#4338ca',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: processing || loading ? 'not-allowed' : 'pointer',
              opacity: processing || loading ? 0.7 : 1,
            }}
          >
            {processing
              ? 'Processing Exchange...'
              : '✓ Confirm & Create Exchange Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
}
