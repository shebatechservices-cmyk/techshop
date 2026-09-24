import React, { useState } from 'react';
import API from '../../../services/api';

const money = (val) => Number.parseFloat(val || 0) || 0;
const taka = (val) => `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const COURIER_PRESETS = [
  { label: 'Steadfast Courier (Inside Dhaka - ৳80)', name: 'Steadfast Courier', charge: 80 },
  { label: 'Steadfast Courier (Outside Dhaka - ৳150)', name: 'Steadfast Courier', charge: 150 },
  { label: 'Pathao Courier (Express - ৳120)', name: 'Pathao Courier', charge: 120 },
  { label: 'Sundarban Courier (৳150)', name: 'Sundarban Courier', charge: 150 },
  { label: 'RedX Delivery (৳130)', name: 'RedX Delivery', charge: 130 },
  { label: 'Free Delivery (৳0)', name: 'In-house Delivery', charge: 0 },
];

export default function EcommerceNewOrderModal({ isOpen, onClose, products = [], onOrderCreated }) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [courierName, setCourierName] = useState('Steadfast Courier');
  const [deliveryCharge, setDeliveryCharge] = useState(80);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [paymentStatus, setPaymentStatus] = useState('unpaid');
  const [items, setItems] = useState([{ product_id: '', quantity: 1, unit_price: 0, stock: 0 }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems((prev) => [...prev, { product_id: '', quantity: 1, unit_price: 0, stock: 0 }]);
  };

  const handleRemoveItem = (idx) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, val) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      if (field === 'product_id') {
        const p = products.find((prod) => String(prod.id) === String(val));
        if (p) {
          updated[idx].unit_price = Number(p.selling_price || p.purchase_price || 0);
          updated[idx].stock = Number(p.stock || 0);
        }
      }
      return updated;
    });
  };

  const itemsSubtotal = items.reduce((sum, it) => sum + money(it.quantity) * money(it.unit_price), 0);
  const finalTotal = itemsSubtotal + money(deliveryCharge);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !shippingAddress.trim()) {
      setError('Please fill in customer name, phone number, and delivery address.');
      return;
    }

    const validItems = items.filter((it) => it.product_id && money(it.quantity) > 0);
    if (validItems.length === 0) {
      setError('Please add at least one product with quantity.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const payload = {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        shipping_address: shippingAddress.trim(),
        customer_notes: customerNotes.trim(),
        courier_name: courierName,
        delivery_charge: Number(deliveryCharge || 0),
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        items: validItems.map((it) => ({
          product_id: it.product_id,
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
        })),
      };

      const res = await fetch(`${API}/ecommerce/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Order placed successfully! Order No: ${data.data?.order_no || ''}`);
        onClose();
        if (onOrderCreated) onOrderCreated();
      } else {
        setError(data.message || 'Failed to place order.');
      }
    } catch (err) {
      setError(err.message || 'Connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
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
          maxWidth: '720px',
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
            background: '#0d9488',
            color: '#ffffff',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>+ Create New Online Order</h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', opacity: 0.9 }}>
              Manual entry for Facebook, phone, WhatsApp or web store orders
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '20px 24px', flex: 1, background: '#f8fafc' }}>
          {error && (
            <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '14px' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Section 1: Customer Details */}
          <div style={{ background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0d9488', textTransform: 'uppercase', marginBottom: '12px' }}>
              1. Customer Information
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shakil Ahmed"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Phone Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="017XXXXXXXX"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                Delivery Address *
              </label>
              <textarea
                required
                rows={2}
                placeholder="House, Road, Area, District/Thana..."
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
                Customer Special Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Call before delivery, urgent parcel..."
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                style={{ width: '100%', padding: '7px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Section 2: Products */}
          <div style={{ background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0d9488', textTransform: 'uppercase' }}>
                2. Order Products ({items.length})
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                style={{
                  padding: '4px 10px',
                  background: '#f0fdfa',
                  border: '1px solid #99f6e4',
                  color: '#0d9488',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                + Add Item
              </button>
            </div>

            {items.map((it, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(200px, 2fr) 70px 100px 90px 30px',
                  gap: '8px',
                  alignItems: 'center',
                  marginBottom: '8px',
                  background: '#f8fafc',
                  padding: '8px',
                  borderRadius: '6px',
                }}
              >
                <div>
                  <select
                    value={it.product_id}
                    onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                    required
                    style={{ width: '100%', padding: '7px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                  >
                    <option value="">-- Choose Product --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stock: {p.stock || 0}) - ৳{Number(p.selling_price || 0).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={it.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    style={{ width: '100%', padding: '7px 6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', textAlign: 'center', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <input
                    type="number"
                    placeholder="Price"
                    value={it.unit_price}
                    onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                    style={{ width: '100%', padding: '7px 6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', textAlign: 'right', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>
                  {taka(money(it.quantity) * money(it.unit_price))}
                </div>

                <div style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={items.length === 1}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: items.length === 1 ? '#cbd5e1' : '#ef4444',
                      cursor: items.length === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '0.9rem',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Section 3: Courier & Payment */}
          <div style={{ background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0d9488', textTransform: 'uppercase', marginBottom: '12px' }}>
              3. Courier &amp; Payment Options
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Courier Service Preset
                </label>
                <select
                  onChange={(e) => {
                    const preset = COURIER_PRESETS.find((p) => p.label === e.target.value);
                    if (preset) {
                      setCourierName(preset.name);
                      setDeliveryCharge(preset.charge);
                    }
                  }}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                >
                  {COURIER_PRESETS.map((p) => (
                    <option key={p.label} value={p.label}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Delivery Fee (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  value={deliveryCharge}
                  onChange={(e) => setDeliveryCharge(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                >
                  <option value="cod">Cash on Delivery (COD)</option>
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="prepaid">Pre-paid / Card</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                >
                  <option value="unpaid">Unpaid (Collect on Delivery)</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>
          </div>

          {/* Total Summary Footer Box */}
          <div
            style={{
              background: '#f0fdfa',
              border: '1px solid #99f6e4',
              borderRadius: '10px',
              padding: '14px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <div>
              <span style={{ fontSize: '0.8rem', color: '#0f766e' }}>Products Subtotal: {taka(itemsSubtotal)}</span>
              <span style={{ fontSize: '0.8rem', color: '#0f766e', marginLeft: '12px' }}>+ Delivery: {taka(deliveryCharge)}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
                Total Payable Amount
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f766e' }}>
                {taka(finalTotal)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px',
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
              type="submit"
              disabled={submitting}
              style={{
                padding: '9px 24px',
                borderRadius: '8px',
                border: 'none',
                background: '#0d9488',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(13, 148, 136, 0.3)',
              }}
            >
              {submitting ? 'Placing Order...' : '✓ Confirm & Place Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
