import React from 'react';
import QuotationMetaSection from '../components/QuotationMetaSection';
import QuotationProductSearchSection from '../components/QuotationProductSearchSection';
import QuotationItemsTable from '../components/QuotationItemsTable';
import QuotationSummarySection from '../components/QuotationSummarySection';
import { usePurchaseQuotation } from '../hooks/usePurchaseQuotation';

export default function PurchaseQuotationModal({
  isOpen,
  onClose,
  onQuotationCreated,
  suppliers: externalSuppliers,
  newlyCreatedSupplier,
  onOpenAddSupplier,
  onOpenAddProduct,
  editingQuotation = null,
}) {
  const {
    suppliers,
    supplierId,
    setSupplierId,
    reference,
    setReference,
    validUntil,
    setValidUntil,
    notes,
    setNotes,
    items,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    filteredProducts,
    handleAddItem,
    handleUpdateItem,
    handleRemoveItem,
    totalAmount,
    totalUnits,
    handleSubmit,
  } = usePurchaseQuotation({
    isOpen,
    onClose,
    onQuotationCreated,
    suppliers: externalSuppliers,
    newlyCreatedSupplier,
    editingQuotation,
  });

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px',
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '860px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8fafc',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
              {editingQuotation && editingQuotation.id ? 'Edit Purchase Quotation' : 'Create Purchase Quotation'}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Request or record price estimates from suppliers before placing an official order
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.4rem',
              cursor: 'pointer',
              color: '#94a3b8',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px', flex: 1 }}>
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.875rem',
              marginBottom: '16px',
            }}>
              {error}
            </div>
          )}

          {/* Quotation Meta */}
          <QuotationMetaSection
            suppliers={suppliers}
            supplierId={supplierId}
            setSupplierId={setSupplierId}
            reference={reference}
            setReference={setReference}
            validUntil={validUntil}
            setValidUntil={setValidUntil}
            onOpenAddSupplier={onOpenAddSupplier}
          />

          {/* Product Search & Add Section */}
          <QuotationProductSearchSection
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredProducts={filteredProducts}
            handleAddItem={handleAddItem}
            onClose={onClose}
            onOpenAddProduct={onOpenAddProduct}
          />

          {/* Quotation Line Items Table */}
          <QuotationItemsTable
            items={items}
            handleUpdateItem={handleUpdateItem}
            handleRemoveItem={handleRemoveItem}
          />

          {/* Bottom Totals and Notes */}
          <QuotationSummarySection
            notes={notes}
            setNotes={setNotes}
            itemsCount={items.length}
            totalUnits={totalUnits}
            totalAmount={totalAmount}
          />

          {/* Footer Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid #f1f5f9',
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '9px 24px',
                borderRadius: '8px',
                border: 'none',
                background: '#0284c7',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Saving Quotation...' : editingQuotation && editingQuotation.id ? 'Update Quotation' : 'Save Quotation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
