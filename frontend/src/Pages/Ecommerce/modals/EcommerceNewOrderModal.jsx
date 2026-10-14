import React, { useState } from 'react';
import { smartFetch } from '../../../services/api';
import { isValidBDPhone } from '../../../utils/phoneUtils';
import { money } from './new-order/newOrderConstants';
import EcommerceCustomerSection from './new-order/EcommerceCustomerSection';
import EcommerceOrderItemsSection from './new-order/EcommerceOrderItemsSection';
import EcommerceCourierPaymentSection from './new-order/EcommerceCourierPaymentSection';
import EcommerceOrderTotalSummary from './new-order/EcommerceOrderTotalSummary';

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

  const itemsSubtotal = items.reduce(
    (sum, it) => sum + money(it.quantity) * money(it.unit_price),
    0
  );
  const finalTotal = itemsSubtotal + money(deliveryCharge);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !shippingAddress.trim()) {
      setError('Please fill in customer name, phone number, and delivery address.');
      return;
    }
    if (!isValidBDPhone(customerPhone)) {
      setError('Please enter a valid 10-digit phone number after +880 (e.g. 17-XXXXXXXX).');
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

      const res = await smartFetch('/ecommerce/orders', {
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
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
              + Create New Online Order
            </h3>
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
        <form
          onSubmit={handleSubmit}
          style={{
            overflowY: 'auto',
            padding: '20px 24px',
            flex: 1,
            background: '#f8fafc',
          }}
        >
          {error && (
            <div
              style={{
                padding: '10px 14px',
                background: '#fee2e2',
                color: '#b91c1c',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '14px',
              }}
            >
              ⚠️ {error}
            </div>
          )}

          <EcommerceCustomerSection
            customerName={customerName}
            setCustomerName={setCustomerName}
            customerPhone={customerPhone}
            setCustomerPhone={setCustomerPhone}
            shippingAddress={shippingAddress}
            setShippingAddress={setShippingAddress}
            customerNotes={customerNotes}
            setCustomerNotes={setCustomerNotes}
          />

          <EcommerceOrderItemsSection
            items={items}
            products={products}
            onAddItem={handleAddItem}
            onRemoveItem={handleRemoveItem}
            onItemChange={handleItemChange}
          />

          <EcommerceCourierPaymentSection
            courierName={courierName}
            setCourierName={setCourierName}
            deliveryCharge={deliveryCharge}
            setDeliveryCharge={setDeliveryCharge}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            paymentStatus={paymentStatus}
            setPaymentStatus={setPaymentStatus}
          />

          <EcommerceOrderTotalSummary
            itemsSubtotal={itemsSubtotal}
            deliveryCharge={deliveryCharge}
            finalTotal={finalTotal}
          />

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
