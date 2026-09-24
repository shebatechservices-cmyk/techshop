import React, { useState, useEffect, useMemo } from 'react';
import API from '../../services/api';

const money = (val) => Number.parseFloat(val || 0) || 0;
const taka = (val) => `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const COURIER_PRESETS = [
  { label: 'Steadfast Courier (Inside Dhaka - ৳80)', name: 'Steadfast Courier', charge: 80 },
  { label: 'Steadfast Courier (Outside Dhaka - ৳150)', name: 'Steadfast Courier', charge: 150 },
  { label: 'Pathao Courier (Express - ৳120)', name: 'Pathao Courier', charge: 120 },
  { label: 'Sundarban Courier (Condition - ৳150)', name: 'Sundarban Courier', charge: 150 },
];

export default function CustomerStorefrontModal({ isOpen, onClose, products = [], onOrderPlaced }) {
  const [activeView, setActiveView] = useState('store'); // 'store' | 'track' | 'account'
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Customer state (local simulation of customer session)
  const [customer, setCustomer] = useState(() => {
    try {
      const saved = localStorage.getItem('sheba_ecommerce_customer');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Auth Form
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authAddress, setAuthAddress] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authMsg, setAuthMsg] = useState('');

  // Checkout Form
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutAddress, setCheckoutAddress] = useState('');
  const [checkoutCourier, setCheckoutCourier] = useState('Steadfast Courier');
  const [checkoutDeliveryFee, setCheckoutDeliveryFee] = useState(80);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState('cod');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  // Tracking State
  const [trackQuery, setTrackQuery] = useState('');
  const [trackingOrders, setTrackingOrders] = useState([]);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');

  // Store Catalog filters
  const [storeSearch, setStoreSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Pre-fill checkout when customer exists
  useEffect(() => {
    if (customer) {
      setCheckoutName(customer.name || '');
      setCheckoutPhone(customer.phone || '');
      setCheckoutAddress(customer.address || '');
    }
  }, [customer]);

  if (!isOpen) return null;

  // Cart operations
  const addToCart = (prod) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === prod.id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === prod.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          product_id: prod.id,
          name: prod.name,
          sku: prod.sku,
          price: Number(prod.selling_price || prod.purchase_price || 0),
          quantity: 1,
          stock: Number(prod.stock || 0),
        },
      ];
    });
    setIsCartOpen(true);
  };

  const updateCartQty = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product_id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const cartGrandTotal = cartSubtotal + Number(checkoutDeliveryFee || 0);

  // Customer Signup/Login
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!authName.trim() || !authPhone.trim()) {
      setAuthMsg('Please enter both name and phone number.');
      return;
    }
    try {
      setAuthLoading(true);
      setAuthMsg('');
      const res = await fetch(`${API}/ecommerce/customer/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: authName.trim(),
          phone: authPhone.trim(),
          address: authAddress.trim(),
          email: authEmail.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const custData = data.data;
        setCustomer(custData);
        localStorage.setItem('sheba_ecommerce_customer', JSON.stringify(custData));
        setAuthMsg('✓ Signed in successfully! Welcome to Sheba Online Store.');
        setCheckoutName(custData.name);
        setCheckoutPhone(custData.phone);
        setCheckoutAddress(custData.address || '');
      } else {
        setAuthMsg(data.message || 'Failed to sign up.');
      }
    } catch (err) {
      setAuthMsg(err.message || 'Connection error.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Customer Logout
  const handleCustomerLogout = () => {
    setCustomer(null);
    localStorage.removeItem('sheba_ecommerce_customer');
    setCheckoutName('');
    setCheckoutPhone('');
    setCheckoutAddress('');
  };

  // Place Online Order
  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      setCheckoutError('Your shopping cart is empty.');
      return;
    }
    if (!checkoutName.trim() || !checkoutPhone.trim() || !checkoutAddress.trim()) {
      setCheckoutError('Please provide delivery recipient name, phone number, and address.');
      return;
    }

    try {
      setPlacingOrder(true);
      setCheckoutError('');
      const payload = {
        customer_name: checkoutName.trim(),
        customer_phone: checkoutPhone.trim(),
        shipping_address: checkoutAddress.trim(),
        customer_notes: checkoutNotes.trim(),
        courier_name: checkoutCourier,
        delivery_charge: Number(checkoutDeliveryFee || 0),
        payment_method: checkoutPaymentMethod,
        payment_status: 'unpaid',
        items: cart.map((it) => ({
          product_id: it.product_id,
          quantity: it.quantity,
          unit_price: it.price,
        })),
      };

      const res = await fetch(`${API}/ecommerce/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const createdOrder = data.data;
        alert(`🎉 Order Placed Successfully! Your Order No is: ${createdOrder.order_no}`);
        setCart([]);
        setIsCartOpen(false);
        if (onOrderPlaced) onOrderPlaced();

        // Automatically switch to parcel tracker for this order!
        setActiveView('track');
        setTrackQuery(createdOrder.order_no);
        handleTrackSearch(createdOrder.order_no);
      } else {
        setCheckoutError(data.message || 'Failed to complete order.');
      }
    } catch (err) {
      setCheckoutError(err.message || 'Connection error.');
    } finally {
      setPlacingOrder(false);
    }
  };

  // Parcel Tracking Search
  const handleTrackSearch = async (overrideQuery) => {
    const q = (overrideQuery || trackQuery).trim();
    if (!q) {
      setTrackingError('Please enter an Order Number (e.g. ECOM-123456) or Phone Number.');
      return;
    }
    try {
      setTrackingLoading(true);
      setTrackingError('');
      setTrackingOrders([]);
      const res = await fetch(`${API}/ecommerce/track/${encodeURIComponent(q)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setTrackingOrders(data.data || []);
      } else {
        setTrackingError(data.message || 'No orders found matching this query.');
      }
    } catch (err) {
      setTrackingError(err.message || 'Error tracking parcel.');
    } finally {
      setTrackingLoading(false);
    }
  };

  // Filtered store catalog
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (storeSearch.trim()) {
        const q = storeSearch.toLowerCase();
        const matchName = String(p.name || '').toLowerCase().includes(q);
        const matchSku = String(p.sku || '').toLowerCase().includes(q);
        if (!matchName && !matchSku) return false;
      }
      return true;
    });
  }, [products, storeSearch]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#f8fafc',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '1100px',
          height: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {/* Top Public E-Commerce Navigation Bar */}
        <div
          style={{
            background: '#0f172a',
            color: '#ffffff',
            padding: '14px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #1e293b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.4rem' }}>🛒</span>
              <div>
                <div style={{ fontWeight: 900, fontSize: '1.15rem', letterSpacing: '-0.02em', color: '#ffffff' }}>
                  SHEBA ONLINE STORE
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  Customer Storefront &amp; Live Parcel Tracking Portal
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', background: '#1e293b', borderRadius: '8px', padding: '3px', marginLeft: '16px' }}>
              <button
                type="button"
                onClick={() => setActiveView('store')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeView === 'store' ? '#0d9488' : 'transparent',
                  color: activeView === 'store' ? '#ffffff' : '#94a3b8',
                }}
              >
                🛍️ Storefront
              </button>
              <button
                type="button"
                onClick={() => setActiveView('track')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeView === 'track' ? '#0d9488' : 'transparent',
                  color: activeView === 'track' ? '#ffffff' : '#94a3b8',
                }}
              >
                📦 Track Parcel
              </button>
              <button
                type="button"
                onClick={() => setActiveView('account')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeView === 'account' ? '#0d9488' : 'transparent',
                  color: activeView === 'account' ? '#ffffff' : '#94a3b8',
                }}
              >
                👤 {customer ? customer.name : 'Sign In'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Cart Button with badge */}
            <button
              type="button"
              onClick={() => setIsCartOpen(!isCartOpen)}
              style={{
                position: 'relative',
                background: cart.length > 0 ? '#0d9488' : '#334155',
                color: '#ffffff',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>🛒 Cart</span>
              <span
                style={{
                  background: '#ffffff',
                  color: '#0f172a',
                  padding: '1px 6px',
                  borderRadius: '999px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                }}
              >
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </span>
              {cart.length > 0 && <span style={{ fontSize: '0.8rem' }}>· {taka(cartSubtotal)}</span>}
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

        {/* View Content Area */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          {/* Main Panel */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {/* VIEW 1: STOREFRONT */}
            {activeView === 'store' && (
              <div>
                {/* Hero Banner */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, #0d9488 0%, #065f46 100%)',
                    borderRadius: '12px',
                    padding: '24px 30px',
                    color: '#ffffff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    boxShadow: '0 4px 15px rgba(13, 148, 136, 0.2)',
                  }}
                >
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>
                      Genuine Security Cameras &amp; Networking Gear
                    </h2>
                    <p style={{ margin: '6px 0 0 0', opacity: 0.9, fontSize: '0.88rem' }}>
                      Fast delivery across all 64 districts with Cash on Delivery (Steadfast &amp; Pathao)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveView('track')}
                    style={{
                      padding: '9px 18px',
                      background: '#ffffff',
                      color: '#065f46',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                    }}
                  >
                    📦 Track Existing Order
                  </button>
                </div>

                {/* Search & Filter */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <input
                    type="text"
                    value={storeSearch}
                    onChange={(e) => setStoreSearch(e.target.value)}
                    placeholder="🔍 Search security products, routers, cameras by name..."
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      background: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Product Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                  {filteredProducts.map((p) => {
                    const price = Number(p.selling_price || p.purchase_price || 0);
                    const stock = Number(p.stock || 0);
                    const inCart = cart.find((it) => it.product_id === p.id);

                    return (
                      <div
                        key={p.id}
                        style={{
                          background: '#ffffff',
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>SKU: {p.sku || 'N/A'}</span>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: stock > 0 ? '#dcfce7' : '#fee2e2',
                                color: stock > 0 ? '#15803d' : '#b91c1c',
                              }}
                            >
                              {stock > 0 ? `In Stock (${stock})` : 'Out of Stock'}
                            </span>
                          </div>

                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginBottom: '6px', lineHeight: '1.3' }}>
                            {p.name}
                          </div>
                        </div>

                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', marginTop: '10px' }}>
                          <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0d9488', marginBottom: '8px' }}>
                            {taka(price)}
                          </div>

                          {inCart ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: '6px', padding: '4px 8px' }}>
                              <button
                                type="button"
                                onClick={() => updateCartQty(p.id, -1)}
                                style={{ border: 'none', background: 'none', fontWeight: 800, color: '#0d9488', cursor: 'pointer', fontSize: '1rem' }}
                              >
                                -
                              </button>
                              <span style={{ fontWeight: 800, color: '#0f766e', fontSize: '0.85rem' }}>
                                {inCart.quantity} in cart
                              </span>
                              <button
                                type="button"
                                onClick={() => updateCartQty(p.id, 1)}
                                style={{ border: 'none', background: 'none', fontWeight: 800, color: '#0d9488', cursor: 'pointer', fontSize: '1rem' }}
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => addToCart(p)}
                              style={{
                                width: '100%',
                                padding: '8px',
                                background: '#0f172a',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: 700,
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                              }}
                            >
                              + Add to Cart
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIEW 2: PARCEL TRACKING */}
            {activeView === 'track' && (
              <div style={{ maxWidth: '780px', margin: '0 auto' }}>
                <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '1.3rem', fontWeight: 900, color: '#0f172a' }}>
                    📦 Track Your Parcel / Order
                  </h3>
                  <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '0.86rem' }}>
                    Enter your Order Number (e.g. ECOM-123456) or Customer Mobile Number to see real-time delivery status
                  </p>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      value={trackQuery}
                      onChange={(e) => setTrackQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleTrackSearch();
                      }}
                      placeholder="e.g. ECOM-482910 or 017XXXXXXXX"
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1.5px solid #0d9488',
                        fontSize: '0.92rem',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleTrackSearch()}
                      disabled={trackingLoading}
                      style={{
                        padding: '10px 22px',
                        background: '#0d9488',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                      }}
                    >
                      {trackingLoading ? 'Searching...' : '🔍 Track Parcel'}
                    </button>
                  </div>

                  {trackingError && (
                    <div style={{ marginTop: '14px', padding: '10px 14px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', fontSize: '0.85rem' }}>
                      ⚠️ {trackingError}
                    </div>
                  )}
                </div>

                {/* Tracking Results */}
                {trackingOrders.map((ord) => {
                  const status = (ord.order_status || 'pending').toLowerCase();
                  const steps = [
                    { key: 'placed', label: 'Order Placed', desc: new Date(ord.created_at).toLocaleDateString() },
                    { key: 'confirmed', label: 'Confirmed', desc: 'Verified by Sheba Tech' },
                    { key: 'processing', label: 'Packed', desc: 'Ready for Courier' },
                    { key: 'shipped', label: 'With Courier', desc: ord.courier_name || 'In Transit' },
                    { key: 'delivered', label: 'Delivered', desc: 'Handed over' },
                  ];

                  let currentIdx = 0;
                  if (status === 'processing') currentIdx = 2;
                  else if (status === 'shipped') currentIdx = 3;
                  else if (status === 'delivered') currentIdx = 4;
                  else currentIdx = 1;

                  return (
                    <div
                      key={ord.id}
                      style={{
                        background: '#ffffff',
                        borderRadius: '12px',
                        padding: '24px',
                        border: '1px solid #e2e8f0',
                        marginBottom: '20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      }}
                    >
                      {/* Order Banner */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', marginBottom: '18px' }}>
                        <div>
                          <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
                            Order #{ord.order_no}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                            Placed on {new Date(ord.created_at).toLocaleString()}
                          </div>
                        </div>
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: '999px',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            background:
                              status === 'delivered'
                                ? '#dcfce7'
                                : status === 'shipped'
                                ? '#e0e7ff'
                                : status === 'processing'
                                ? '#fef3c7'
                                : '#f1f5f9',
                            color:
                              status === 'delivered'
                                ? '#15803d'
                                : status === 'shipped'
                                ? '#4338ca'
                                : status === 'processing'
                                ? '#b45309'
                                : '#475569',
                          }}
                        >
                          {status}
                        </span>
                      </div>

                      {/* Visual Stepper */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: '24px' }}>
                        {steps.map((st, sIdx) => {
                          const isDone = currentIdx >= sIdx;
                          return (
                            <div key={st.key} style={{ flex: 1, textAlign: 'center' }}>
                              <div
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  background: isDone ? '#0d9488' : '#e2e8f0',
                                  color: isDone ? '#ffffff' : '#64748b',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  margin: '0 auto 6px auto',
                                  fontWeight: 800,
                                  fontSize: '0.82rem',
                                }}
                              >
                                {isDone ? '✓' : sIdx + 1}
                              </div>
                              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: isDone ? '#0f172a' : '#94a3b8' }}>
                                {st.label}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                                {st.desc}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Courier & Shipping Details */}
                      <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '14px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.84rem', marginBottom: '16px' }}>
                        <div>
                          <span style={{ color: '#64748b', display: 'block', fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700 }}>
                            Delivery Courier Partner
                          </span>
                          <strong style={{ color: '#0f172a' }}>{ord.courier_name || 'Standard Courier'}</strong>
                          {ord.tracking_code && (
                            <div style={{ marginTop: '4px', color: '#0284c7', fontWeight: 700 }}>
                              Consignment ID: {ord.tracking_code}
                            </div>
                          )}
                        </div>

                        <div>
                          <span style={{ color: '#64748b', display: 'block', fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700 }}>
                            Delivery Destination
                          </span>
                          <span style={{ color: '#1e293b' }}>{ord.shipping_address}</span>
                        </div>
                      </div>

                      {/* Items in parcel */}
                      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                          Items In Parcel:
                        </div>
                        {(ord.items || []).map((it, iIdx) => (
                          <div key={iIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '4px 0' }}>
                            <span style={{ color: '#0f172a', fontWeight: 600 }}>
                              {it.product_name || `Product #${it.product_id}`} × {it.quantity}
                            </span>
                            <strong style={{ color: '#0f172a' }}>{taka(money(it.quantity) * money(it.unit_price))}</strong>
                          </div>
                        ))}
                      </div>

                      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px', marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.84rem', color: '#64748b' }}>
                          Payment: <strong>{(ord.payment_method || 'COD').toUpperCase()}</strong> (
                          {ord.payment_status === 'paid' ? 'Paid' : 'Collect on Delivery'})
                        </span>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0d9488' }}>
                          Total: {taka(ord.total_amount)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* VIEW 3: CUSTOMER ACCOUNT / SIGN IN */}
            {activeView === 'account' && (
              <div style={{ maxWidth: '520px', margin: '0 auto', background: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
                {customer ? (
                  <div>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                      👤 My Account
                    </h3>
                    <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '0.85rem' }}>
                      Your profile details are automatically used for rapid checkout.
                    </p>

                    <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', border: '1px solid #e2e8f0', marginBottom: '16px', fontSize: '0.88rem' }}>
                      <div style={{ marginBottom: '8px' }}>
                        <span style={{ color: '#64748b' }}>Full Name:</span> <strong>{customer.name}</strong>
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <span style={{ color: '#64748b' }}>Mobile Number:</span> <strong>{customer.phone}</strong>
                      </div>
                      {customer.email && (
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{ color: '#64748b' }}>Email:</span> <strong>{customer.email}</strong>
                        </div>
                      )}
                      <div>
                        <span style={{ color: '#64748b' }}>Saved Delivery Address:</span>
                        <div style={{ marginTop: '2px', color: '#0f172a' }}>{customer.address || 'No address saved yet'}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveView('track');
                          setTrackQuery(customer.phone);
                          handleTrackSearch(customer.phone);
                        }}
                        style={{
                          flex: 1,
                          padding: '9px',
                          background: '#0d9488',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                        }}
                      >
                        📦 View My Previous Orders
                      </button>
                      <button
                        type="button"
                        onClick={handleCustomerLogout}
                        style={{
                          padding: '9px 16px',
                          background: '#ffffff',
                          color: '#ef4444',
                          border: '1px solid #fecaca',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                        }}
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                      👤 Customer Sign Up &amp; Login
                    </h3>
                    <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '0.85rem' }}>
                      Sign in or create an account to order and track your delivery parcels easily.
                    </p>

                    {authMsg && (
                      <div style={{ padding: '10px 14px', background: authMsg.includes('✓') ? '#dcfce7' : '#fee2e2', color: authMsg.includes('✓') ? '#15803d' : '#b91c1c', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '14px' }}>
                        {authMsg}
                      </div>
                    )}

                    <form onSubmit={handleAuthSubmit}>
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                          Your Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Tanvir Hasan"
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                          Mobile Number *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="017XXXXXXXX"
                          value={authPhone}
                          onChange={(e) => setAuthPhone(e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                          Delivery Address
                        </label>
                        <input
                          type="text"
                          placeholder="House, Road, Area, City..."
                          value={authAddress}
                          onChange={(e) => setAuthAddress(e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                          Email (Optional)
                        </label>
                        <input
                          type="email"
                          placeholder="name@gmail.com"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={authLoading}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: '#0d9488',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                        }}
                      >
                        {authLoading ? 'Signing in...' : 'Sign In / Register Account'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Slide-out Cart & Checkout Drawer */}
          {isCartOpen && (
            <div
              style={{
                width: '360px',
                background: '#ffffff',
                borderLeft: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                boxShadow: '-4px 0 20px rgba(0,0,0,0.06)',
                zIndex: 10,
              }}
            >
              {/* Drawer Header */}
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '1rem', color: '#0f172a' }}>
                  🛒 Your Order Cart ({cart.length})
                </strong>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '1rem', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              {/* Cart Items List */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>
                {cart.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                    <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>🛍️</span>
                    Your cart is empty. Add products from the storefront to place an order!
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      {cart.map((it) => (
                        <div
                          key={it.product_id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 0',
                            borderBottom: '1px solid #f1f5f9',
                          }}
                        >
                          <div style={{ flex: 1, paddingRight: '8px' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.84rem', color: '#0f172a' }}>
                              {it.name}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                              {taka(it.price)} × {it.quantity}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => updateCartQty(it.product_id, -1)}
                              style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: 800 }}
                            >
                              -
                            </button>
                            <span style={{ fontWeight: 700, fontSize: '0.84rem', minWidth: '16px', textAlign: 'center' }}>
                              {it.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartQty(it.product_id, 1)}
                              style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: 800 }}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Quick Checkout Form */}
                    <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0d9488', textTransform: 'uppercase', marginBottom: '10px' }}>
                        Delivery &amp; Checkout Details
                      </div>

                      {checkoutError && (
                        <div style={{ padding: '8px 10px', background: '#fee2e2', color: '#b91c1c', borderRadius: '6px', fontSize: '0.78rem', marginBottom: '8px' }}>
                          ⚠️ {checkoutError}
                        </div>
                      )}

                      <div style={{ marginBottom: '8px' }}>
                        <input
                          type="text"
                          required
                          placeholder="Your Name *"
                          value={checkoutName}
                          onChange={(e) => setCheckoutName(e.target.value)}
                          style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div style={{ marginBottom: '8px' }}>
                        <input
                          type="text"
                          required
                          placeholder="Mobile Number *"
                          value={checkoutPhone}
                          onChange={(e) => setCheckoutPhone(e.target.value)}
                          style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div style={{ marginBottom: '8px' }}>
                        <textarea
                          required
                          rows={2}
                          placeholder="Full Delivery Address *"
                          value={checkoutAddress}
                          onChange={(e) => setCheckoutAddress(e.target.value)}
                          style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div style={{ marginBottom: '8px' }}>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '2px' }}>
                          Courier &amp; Delivery Fee
                        </label>
                        <select
                          onChange={(e) => {
                            const preset = COURIER_PRESETS.find((p) => p.label === e.target.value);
                            if (preset) {
                              setCheckoutCourier(preset.name);
                              setCheckoutDeliveryFee(preset.charge);
                            }
                          }}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                        >
                          {COURIER_PRESETS.map((p) => (
                            <option key={p.label} value={p.label}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '2px' }}>
                          Payment Method
                        </label>
                        <select
                          value={checkoutPaymentMethod}
                          onChange={(e) => setCheckoutPaymentMethod(e.target.value)}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                        >
                          <option value="cod">Cash on Delivery (COD)</option>
                          <option value="bkash">bKash</option>
                          <option value="nagad">Nagad</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Drawer Footer with Calculation */}
              {cart.length > 0 && (
                <div style={{ padding: '14px 18px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b', marginBottom: '4px' }}>
                    <span>Items Subtotal:</span>
                    <span>{taka(cartSubtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b', marginBottom: '8px' }}>
                    <span>Delivery Fee:</span>
                    <span>{taka(checkoutDeliveryFee)}</span>
                  </div>
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', marginBottom: '12px' }}>
                    <span>Total Payable:</span>
                    <span style={{ color: '#0d9488' }}>{taka(cartGrandTotal)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCheckoutSubmit}
                    disabled={placingOrder}
                    style={{
                      width: '100%',
                      padding: '11px',
                      background: '#0d9488',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.92rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 10px rgba(13, 148, 136, 0.3)',
                    }}
                  >
                    {placingOrder ? 'Submitting Order...' : '✓ Confirm & Place Order'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
