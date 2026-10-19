import React from 'react';
import PurchasePrintModal from './PurchasePrintModal';
import LedgerSupplierMeta from '../components/LedgerSupplierMeta';
import LedgerItemsTable from '../components/LedgerItemsTable';
import LedgerFinancialSummary from '../components/LedgerFinancialSummary';
import LedgerActionFooter from '../components/LedgerActionFooter';
import PurchaseLedgerModalHeader from './ledger/PurchaseLedgerModalHeader';
import usePurchaseLedgerPreview, { taka } from './ledger/usePurchaseLedgerPreview';

export default function PurchaseLedgerPreviewModal({
  isOpen,
  onClose,
  orderId,
  purchaseOrderId,
  initialOrder = null,
  purchaseOrderData = null,
  onLoadInForm,
  onOpenInPurchaseForm,
  onOpenPrint,
}) {
  const {
    order,
    loading,
    error,
    copySuccess,
    isInternalPrintOpen,
    setIsInternalPrintOpen,
    poNumber,
    dateStr,
    supplierName,
    supplierPhone,
    supplierContact,
    items,
    payments,
    itemsSubtotal,
    extraCost,
    totalCost,
    totalPaid,
    remainingDue,
    handleShareWhatsApp,
    handleCopySummary,
  } = usePurchaseLedgerPreview({
    isOpen,
    onClose,
    orderId,
    purchaseOrderId,
    initialOrder,
    purchaseOrderData,
  });

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100020,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          border: '1px solid #cbd5e1',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <PurchaseLedgerModalHeader
          poNumber={poNumber}
          dateStr={dateStr}
          onClose={onClose}
        />

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '0.95rem' }}>
              Loading voucher details...
            </div>
          ) : error ? (
            <div style={{ padding: '16px', background: '#fef2f2', color: '#dc2626', borderRadius: '8px', fontSize: '0.88rem' }}>
              {error}
            </div>
          ) : (
            <>
              {/* Supplier & Order Meta Bar */}
              <LedgerSupplierMeta
                supplierName={supplierName}
                supplierPhone={supplierPhone}
                supplierContact={supplierContact}
                order={order}
                extraCost={extraCost}
              />

              {/* Items Table */}
              <LedgerItemsTable items={items} taka={taka} />

              {/* Financial Breakdown & Tenders */}
              <LedgerFinancialSummary
                payments={payments}
                itemsSubtotal={itemsSubtotal}
                extraCost={extraCost}
                totalCost={totalCost}
                totalPaid={totalPaid}
                remainingDue={remainingDue}
                order={order}
                taka={taka}
              />
            </>
          )}
        </div>

        {/* Footer Actions */}
        <LedgerActionFooter
          order={order}
          copySuccess={copySuccess}
          onLoadInForm={onLoadInForm}
          onOpenInPurchaseForm={onOpenInPurchaseForm}
          onOpenPrint={onOpenPrint}
          setIsInternalPrintOpen={setIsInternalPrintOpen}
          handleShareWhatsApp={handleShareWhatsApp}
          handleCopySummary={handleCopySummary}
          onClose={onClose}
        />
      </div>

      {/* Internal Print Modal (if opened directly) */}
      {isInternalPrintOpen && (
        <PurchasePrintModal
          isOpen={isInternalPrintOpen}
          order={order}
          onClose={() => setIsInternalPrintOpen(false)}
        />
      )}
    </div>
  );
}
