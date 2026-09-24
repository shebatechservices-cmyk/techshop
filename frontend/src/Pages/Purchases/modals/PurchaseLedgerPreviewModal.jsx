import React, { useState, useEffect } from 'react';
import PurchasePrintModal from './PurchasePrintModal';
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
  const extraCost = Number(order?.extra_cost || 0);
  const totalCost = Number(order?.total_cost || itemsSubtotal + extraCost);
  const totalPaid = Number(
    order?.total_paid !== undefined
      ? order.total_paid
      : payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
  );
  const remainingDue = Math.max(0, totalCost - totalPaid);

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
    if (extraCost > 0) {
      text += `*Extra Cost (${order?.extra_cost_category || 'Logistics'}):* ${taka(extraCost)}\n`;
    }
    text += `*Grand Total Cost:* ${taka(totalCost)}\n`;
    text += `*Paid Amount:* ${taka(totalPaid)}\n`;
    text += `*Remaining Due:* ${remainingDue > 0 ? taka(remainingDue) : 'No Dues (Paid in Full)'}\n`;
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
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 1fr',
                  gap: '16px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '14px 18px',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Supplier Information
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#0f172a', marginTop: '2px' }}>
                    {supplierName}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '3px', display: 'flex', gap: '12px' }}>
                    {supplierPhone && <span>📞 {supplierPhone}</span>}
                    {supplierContact && <span>Code: {supplierContact}</span>}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Reference & Status
                  </div>
                  <div style={{ fontSize: '0.86rem', color: '#1e293b', fontWeight: 600, marginTop: '2px' }}>
                    Ref: {order?.transaction_reference || 'N/A'}
                  </div>
                  <div style={{ marginTop: '4px', display: 'flex', gap: '6px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, background: '#dcfce7', color: '#15803d' }}>
                      Status: Approved
                    </span>
                    {extraCost > 0 && (
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: '#fef3c7', color: '#b45309' }}>
                        Overhead: {order?.extra_cost_category || 'Logistics'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  Purchased Items ({items.length})
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '10px 12px', width: '36px' }}>#</th>
                        <th style={{ padding: '10px 12px' }}>Product Description</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', width: '60px' }}>Qty</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>Cost Price</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>Sale Price</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>Margin</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx) => {
                        const qty = Number(it.quantity || 1);
                        const cost = Number(it.cost_price || 0);
                        const sale = Number(it.final_sale_price || it.sale_price || 0);
                        const lineTotal = Number(it.line_total || cost * qty);
                        const margin = it.margin_value ? `${it.margin_value}%` : '—';
                        const desc = it.full_name || it.name || it.product_name || 'Product';

                        return (
                          <tr key={it.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{idx + 1}</td>
                            <td style={{ padding: '10px 12px' }}>
                              <div style={{ fontWeight: 600, color: '#0f172a' }}>{desc}</div>
                              <div style={{ display: 'flex', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                                {it.category_name && (
                                  <span style={{ fontSize: '0.72rem', background: '#e2e8f0', color: '#334155', padding: '1px 6px', borderRadius: '4px' }}>
                                    {it.category_name}
                                  </span>
                                )}
                                {it.sku && (
                                  <span style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#64748b', padding: '1px 6px', borderRadius: '4px' }}>
                                    SKU: {it.sku}
                                  </span>
                                )}
                              </div>
                              {it.serials && it.serials.length > 0 && (
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                                  {it.serials.map((s) => (
                                    <span key={s} style={{ fontSize: '0.7rem', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '1px 5px', borderRadius: '3px' }}>
                                      SN: {s}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>{qty}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', color: '#334155' }}>{taka(cost)}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', color: '#64748b' }}>{taka(sale)}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'center', color: '#10b981', fontWeight: 600 }}>{margin}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{taka(lineTotal)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Breakdown & Tenders */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Payment Tenders Recorded */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', background: '#f8fafc' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Payment Tenders
                  </div>
                  {payments.length === 0 ? (
                    <div style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic' }}>
                      No payment records attached (Fully Due)
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {payments.map((p, pIdx) => (
                        <div key={p.id || pIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', padding: '6px 8px', background: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          <div>
                            <span style={{ fontWeight: 600, color: '#1e293b' }}>{p.payment_method || 'Cash'}</span>
                            <span style={{ color: '#64748b', fontSize: '0.76rem', marginLeft: '6px' }}>
                              ({p.account_name || p.sub_option || 'Primary'})
                            </span>
                            {p.receiver_name && (
                              <div style={{ fontSize: '0.72rem', color: '#0284c7' }}>
                                Receiver: {p.receiver_name}
                              </div>
                            )}
                            {p.transaction_id && (
                              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                Trx: {p.transaction_id}
                              </div>
                            )}
                          </div>
                          <strong style={{ color: '#10b981' }}>{taka(p.amount)}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Totals Summary */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#475569' }}>
                    <span>Items Subtotal:</span>
                    <span>{taka(itemsSubtotal)}</span>
                  </div>
                  {extraCost > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#475569' }}>
                      <span>Extra Cost ({order?.extra_cost_category || 'Logistics'}):</span>
                      <span>{taka(extraCost)}</span>
                    </div>
                  )}
                  <div style={{ height: '1px', background: '#e2e8f0', margin: '2px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.94rem', fontWeight: 800, color: '#0f172a' }}>
                    <span>Grand Total Cost:</span>
                    <span>{taka(totalCost)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#10b981', fontWeight: 600 }}>
                    <span>Total Paid:</span>
                    <span>{taka(totalPaid)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, color: remainingDue > 0 ? '#dc2626' : '#10b981' }}>
                    <span>Remaining Due:</span>
                    <span>{remainingDue > 0 ? taka(remainingDue) : '✓ No Dues'}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #e2e8f0',
            background: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Open / Load in Form Button */}
            <button
              type="button"
              onClick={() => {
                const handler = onLoadInForm || onOpenInPurchaseForm;
                if (handler && order) {
                  handler(order);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                background: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
              title="Load this order's items and details into the Purchase Order form"
            >
              📝 Open in Purchase Form
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={() => {
                if (onOpenPrint && order) {
                  onOpenPrint(order);
                } else if (order) {
                  setIsInternalPrintOpen(true);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                background: '#f8fafc',
                color: '#334155',
                border: '1px solid #cbd5e1',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              🖨️ Print Invoice
            </button>

            {/* WhatsApp Share */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                background: '#25d366',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              📲 WhatsApp
            </button>

            {/* Copy Summary */}
            <button
              type="button"
              onClick={handleCopySummary}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {copySuccess ? '✓ Copied' : '📋 Copy'}
            </button>
          </div>

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
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
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
