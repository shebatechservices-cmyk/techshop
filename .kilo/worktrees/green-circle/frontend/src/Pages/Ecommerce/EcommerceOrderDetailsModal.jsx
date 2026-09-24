import React, { useState } from 'react';
import API from '../../services/api';

const money = (val) => Number.parseFloat(val || 0) || 0;
const taka = (val) => `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const COURIER_OPTIONS = [
  'Steadfast Courier',
  'Pathao Courier',
  'RedX Delivery',
  'Sundarban Courier',
  'Paperfly',
  'eCourier',
  'In-house / Merchant Delivery',
];

const STATUS_STEPS = [
  { key: 'pending', label: 'Pending', icon: '⏳', desc: 'Order received, awaiting review' },
  { key: 'processing', label: 'Processing', icon: '📦', desc: 'Items being picked & packed' },
  { key: 'shipped', label: 'Shipped', icon: '🚚', desc: 'Handed to courier for delivery' },
  { key: 'delivered', label: 'Delivered', icon: '✅', desc: 'Delivered to customer' },
];

export default function EcommerceOrderDetailsModal({
  isOpen,
  onClose,
  order,
  onOrderUpdated,
  onOpenPrint,
}) {
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [courierName, setCourierName] = useState(order?.courier_name || '');
  const [trackingCode, setTrackingCode] = useState(order?.tracking_code || '');
  const [paymentStatus, setPaymentStatus] = useState(order?.payment_status || 'unpaid');
  const [savingDetails, setSavingDetails] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen || !order) return null;

  const currentStatus = (order.order_status || 'pending').toLowerCase();
  const isCancelled = currentStatus === 'cancelled';

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleStatusChange = async (newStatus) => {
    if (updatingStatus || newStatus === currentStatus) return;
    try {
      setUpdatingStatus(true);
      setError('');
      const res = await fetch(`${API}/ecommerce/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showSuccess(`Status changed to ${newStatus.toUpperCase()}`);
        if (onOrderUpdated) onOrderUpdated();
      } else {
        setError(data.message || 'Failed to update order status');
      }
    } catch (err) {
      setError(err.message || 'Connection error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveCourierAndPayment = async (e) => {
    e.preventDefault();
    try {
      setSavingDetails(true);
      setError('');
      const res = await fetch(`${API}/ecommerce/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courier_name: courierName,
          tracking_code: trackingCode,
          payment_status: paymentStatus,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showSuccess('Courier and payment information saved!');
        if (onOrderUpdated) onOrderUpdated();
      } else {
        setError(data.message || 'Failed to update details');
      }
    } catch (err) {
      setError(err.message || 'Connection error');
    } finally {
      setSavingDetails(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!window.confirm(`Are you sure you want to delete online order #${order.order_no || order.id}? Inventory stock will be restored.`)) {
      return;
    }
    try {
      const res = await fetch(`${API}/ecommerce/orders/${order.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Order deleted successfully.');
        onClose();
        if (onOrderUpdated) onOrderUpdated();
      } else {
        alert(data.message || 'Failed to delete order');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // WhatsApp shortcut link
  const rawPhone = (order.customer_phone || '').replace(/[^0-9]/g, '');
  const bdPhone = rawPhone.startsWith('880') ? rawPhone : (rawPhone.startsWith('0') ? `88${rawPhone}` : `880${rawPhone}`);
  const whatsappUrl = `https://wa.me/${bdPhone}?text=Hello%20${encodeURIComponent(order.customer_name || 'Customer')},%20regarding%20your%20Sheba%20Technology%20online%20order%20%23${encodeURIComponent(order.order_no || order.id)}`;

  const items = order.items || [];
  const itemsSubtotal = items.reduce((sum, it) => sum + money(it.quantity) * money(it.unit_price), 0);
  const deliveryCharge = money(order.delivery_charge || 0);
  const grandTotal = money(order.total_amount || (itemsSubtotal + deliveryCharge));

  const currentStepIdx = STATUS_STEPS.findIndex((s) => s.key === currentStatus);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          width: '100%',
          maxWidth: '860px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            background: '#0f172a',
            color: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>🛍️</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                  Order #{order.order_no || order.order_number || order.id}
                </h3>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    background:
                      currentStatus === 'delivered'
                        ? '#dcfce7'
                        : currentStatus === 'shipped'
                        ? '#e0e7ff'
                        : currentStatus === 'processing'
                        ? '#fef3c7'
                        : currentStatus === 'cancelled'
                        ? '#fee2e2'
                        : '#f1f5f9',
                    color:
                      currentStatus === 'delivered'
                        ? '#15803d'
                        : currentStatus === 'shipped'
                        ? '#4338ca'
                        : currentStatus === 'processing'
                        ? '#b45309'
                        : currentStatus === 'cancelled'
                        ? '#b91c1c'
                        : '#475569',
                  }}
                >
                  {order.order_status || 'Pending'}
                </span>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Placed on {order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => onOpenPrint && onOpenPrint(order)}
              style={{
                padding: '6px 14px',
                background: '#0d9488',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              🖨️ Print Slip
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#ffffff',
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ overflowY: 'auto', padding: '20px 24px', flex: 1, background: '#f8fafc' }}>
          {error && (
            <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '14px' }}>
              ⚠️ {error}
            </div>
          )}
          {successMsg && (
            <div style={{ padding: '10px 14px', background: '#dcfce7', color: '#15803d', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '14px' }}>
              ✓ {successMsg}
            </div>
          )}

          {/* Stepper Timeline */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '10px',
              padding: '16px 20px',
              border: '1px solid #e2e8f0',
              marginBottom: '16px',
            }}
          >
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>
              Fulfillment Timeline &amp; Status Stepper
            </div>

            {isCancelled ? (
              <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', fontWeight: 700 }}>
                  <span>🚫</span> This order has been cancelled and its inventory stock restored.
                </div>
                <button
                  type="button"
                  onClick={() => handleStatusChange('pending')}
                  disabled={updatingStatus}
                  style={{
                    padding: '6px 12px',
                    background: '#ffffff',
                    border: '1px solid #dc2626',
                    color: '#dc2626',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Reopen Order
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                {STATUS_STEPS.map((step, idx) => {
                  const isDone = currentStepIdx >= idx;
                  const isCurrent = currentStepIdx === idx;
                  return (
                    <div
                      key={step.key}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        position: 'relative',
                        zIndex: 2,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleStatusChange(step.key)}
                        disabled={updatingStatus}
                        title={`Change to ${step.label}`}
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: isDone ? '#0d9488' : '#e2e8f0',
                          color: isDone ? '#ffffff' : '#64748b',
                          border: isCurrent ? '3px solid #99f6e4' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: isCurrent ? '0 0 0 4px rgba(13, 148, 136, 0.2)' : 'none',
                        }}
                      >
                        {step.icon}
                      </button>
                      <span style={{ fontSize: '0.78rem', fontWeight: isCurrent ? 800 : 600, color: isDone ? '#0f172a' : '#94a3b8', marginTop: '6px' }}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {!isCancelled && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => handleStatusChange('cancelled')}
                  disabled={updatingStatus}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Cancel Order &amp; Restock Products
                </button>
              </div>
            )}
          </div>

          {/* Two-Column Customer & Courier Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {/* Customer Details Box */}
            <div style={{ background: '#ffffff', borderRadius: '10px', padding: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0d9488', textTransform: 'uppercase', marginBottom: '8px' }}>
                👤 Customer &amp; Recipient
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{order.customer_name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '0.86rem', color: '#334155' }}>📞 {order.customer_phone}</span>
                <a
                  href={`tel:${order.customer_phone}`}
                  style={{ fontSize: '0.74rem', padding: '2px 8px', background: '#f1f5f9', borderRadius: '4px', textDecoration: 'none', color: '#0284c7', fontWeight: 600 }}
                >
                  Call
                </a>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '0.74rem', padding: '2px 8px', background: '#dcfce7', borderRadius: '4px', textDecoration: 'none', color: '#16a34a', fontWeight: 700 }}
                >
                  WhatsApp
                </a>
              </div>
              <div style={{ marginTop: '8px', fontSize: '0.82rem', color: '#64748b', lineHeight: '1.4' }}>
                <strong>Address:</strong> {order.shipping_address}
              </div>
              {order.customer_notes && (
                <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#92400e', background: '#fef3c7', padding: '6px 10px', borderRadius: '6px' }}>
                  <strong>Note:</strong> {order.customer_notes}
                </div>
              )}
            </div>

            {/* Courier & Payment Editor Box */}
            <div style={{ background: '#ffffff', borderRadius: '10px', padding: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0d9488', textTransform: 'uppercase', marginBottom: '8px' }}>
                🚚 Logistics &amp; Payment Status
              </div>
              <form onSubmit={handleSaveCourierAndPayment}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', marginBottom: '3px' }}>
                      COURIER PARTNER
                    </label>
                    <select
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    >
                      <option value="">-- Choose Courier --</option>
                      {COURIER_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', marginBottom: '3px' }}>
                      PAYMENT STATUS
                    </label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    >
                      <option value="unpaid">Unpaid / COD</option>
                      <option value="paid">Paid</option>
                      <option value="partial">Partially Paid</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', marginBottom: '3px' }}>
                    TRACKING / CONSIGNMENT ID
                  </label>
                  <input
                    type="text"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    placeholder="e.g. STDF-124982 or Pathao CN"
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingDetails}
                  style={{
                    padding: '6px 14px',
                    background: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {savingDetails ? 'Saving...' : 'Save Logistics Info'}
                </button>
              </form>
            </div>
          </div>

          {/* Items Table */}
          <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '0.84rem', color: '#0f172a', textTransform: 'uppercase' }}>
                Ordered Products ({items.length})
              </span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>PRODUCT</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center', width: '80px' }}>QTY</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', width: '110px' }}>UNIT PRICE</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', width: '110px' }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => {
                  const lineTotal = money(it.quantity) * money(it.unit_price);
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{it.product_name || `Product ID #${it.product_id}`}</div>
                        {it.sku && <div style={{ fontSize: '0.74rem', color: '#64748b' }}>SKU: {it.sku}</div>}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>{it.quantity}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#334155' }}>{taka(it.unit_price)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{taka(lineTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom Financials Summary Box */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleDeleteOrder}
              style={{
                background: 'none',
                border: 'none',
                color: '#ef4444',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🗑️ Delete Order
            </button>

            <div style={{ width: '280px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b', marginBottom: '4px' }}>
                <span>Subtotal:</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{taka(itemsSubtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b', marginBottom: '6px' }}>
                <span>Delivery Charge:</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{taka(deliveryCharge)}</span>
              </div>
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                <span>Grand Total:</span>
                <span style={{ color: '#0d9488' }}>{taka(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
