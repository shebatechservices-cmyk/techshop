import React, { useState, useEffect } from 'react';
import PurchasePrintModal from './PurchasePrintModal';
import LedgerSupplierMeta from '../components/LedgerSupplierMeta';
import LedgerItemsTable from '../components/LedgerItemsTable';
import LedgerFinancialSummary from '../components/LedgerFinancialSummary';
import LedgerActionFooter from '../components/LedgerActionFooter';
import API_BASE from '../../../services/api';

const taka = (val) =>
  `৳${(Number(val) || 0).toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

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
  const activeOrderId = orderId || purchaseOrderId || initialOrder?.id || purchaseOrderData?.id;
  const initial = initialOrder || purchaseOrderData;
  const [order, setOrder] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [isInternalPrintOpen, setIsInternalPrintOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (onClose) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    if (initial && Array.isArray(initial.items) && initial.items.length > 0) {
      setOrder(initial);
      return;
    }
    if (!activeOrderId) return;

    let isMounted = true;
    const fetchDetails = async () => {
      setLoading(true);
      setError('');
      try {
        let res = await fetch(`${API_BASE}/purchase/${activeOrderId}`);
        if (!res.ok) {
          res = await fetch(`${API_BASE}/purchase/orders/${activeOrderId}`);
        }
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setOrder(data);
        } else {
          if (isMounted) setError('Failed to load purchase voucher details');
        }
      } catch (err) {
        console.error('Fetch purchase order details error:', err);
        if (isMounted) setError('Error connecting to server');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [isOpen, activeOrderId, initial]);

  if (!isOpen) return null;

  const poNumber = order?.po_number || `PO-${order?.id || '—'}`;
  const dateStr = order?.created_at
    ? new Date(order.created_at).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

  const supplierName = order?.supplier_name || 'Vendor / Supplier';
  const supplierPhone = order?.supplier_phone || '';
  const supplierContact = order?.supplier_contact || '';
  const items = Array.isArray(order?.items) ? order.items : [];
  const payments = Array.isArray(order?.payments) ? order.payments : [];

  const itemsSubtotal = items.reduce(
    (sum, it) => sum + Number(it.cost_price || 0) * Number(it.quantity || 0),
    0
  );
  const discount = Number(order?.discount || 0);
  const extraCost = Number(order?.extra_cost || 0);
  const totalCost = Number(order?.total_cost !== undefined ? order.total_cost : Math.max(0, itemsSubtotal - discount));
  const totalPaid = Number(
    order?.total_paid !== undefined
      ? order.total_paid
      : payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
  );
  const remainingDue = Number(
    order?.total_due !== undefined ? order.total_due : Math.max(0, totalCost - totalPaid)
  );

  const handleShareWhatsApp = () => {
    let text = `*PURCHASE INVOICE - SHEBA TECHNOLOGY*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `*PO No:* ${poNumber}\n`;
    text += `*Date:* ${dateStr}\n`;
    text += `*Supplier:* ${supplierName} (${supplierPhone || 'N/A'})\n`;
    if (order?.transaction_reference) {
      text += `*Ref:* ${order.transaction_reference}\n`;
    }
    text += `-------------------------------------\n`;
    text += `*PURCHASED ITEMS:*\n`;
    items.forEach((it, idx) => {
      const name = it.full_name || it.name || it.product_name || 'Product';
      const qty = it.quantity || 1;
      const cost = Number(it.cost_price || 0);
      const total = Number(it.line_total || cost * qty);
      text += `${idx + 1}. *${name}*\n   Qty: ${qty} × ৳${cost.toLocaleString()} = ৳${total.toLocaleString()}\n`;
      if (it.serials && it.serials.length > 0) {
        text += `   S/N: ${it.serials.join(', ')}\n`;
      }
    });
    text += `-------------------------------------\n`;
    text += `*Items Subtotal:* ${taka(itemsSubtotal)}\n`;
    if (discount > 0) {
      text += `*Less Discount:* -${taka(discount)}\n`;
    }
    text += `*Supplier Bill:* ${taka(totalCost)}\n`;
    text += `*Paid Amount:* ${taka(totalPaid)}\n`;
    text += `*Remaining Due:* ${remainingDue > 0 ? taka(remainingDue) : 'No Dues (Paid in Full)'}\n`;
    if (extraCost > 0) {
      text += `-------------------------------------\n`;
      text += `*Logistics Expense (${order?.extra_cost_category || 'Transport'}):* ${taka(extraCost)}\n`;
      text += `*Total Landed Cost:* ${taka(totalCost + extraCost)}\n`;
    }
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;

    let cleanPhone = supplierPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('01')) cleanPhone = '88' + cleanPhone;
    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopySummary = () => {
    let text = `PURCHASE ORDER: ${poNumber}\nDate: ${dateStr}\nSupplier: ${supplierName} (${supplierPhone})\nTotal: ${taka(totalCost)} | Paid: ${taka(totalPaid)} | Due: ${taka(remainingDue)}`;
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

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
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>🧾</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  Purchase Order Ledger Preview
                </h2>
                <span
                  style={{
                    background: '#e0f2fe',
                    color: '#0369a1',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                  }}
                >
                  {poNumber}
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                Issued: {dateStr}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.3rem',
              color: '#64748b',
              cursor: 'pointer',
              padding: '4px',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

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
