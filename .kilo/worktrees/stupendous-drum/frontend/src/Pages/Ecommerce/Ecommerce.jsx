import React, { useState, useEffect, useMemo } from 'react';
import API from '../../services/api';
import EcommerceOrderDetailsModal from './EcommerceOrderDetailsModal';
import EcommerceNewOrderModal from './EcommerceNewOrderModal';
import EcommercePrintModal from './EcommercePrintModal';
import CustomerStorefrontModal from './CustomerStorefrontModal';

const money = (val) => Number.parseFloat(val || 0) || 0;
const taka = (val) => `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_CONFIG = {
  all: { label: 'All Orders', color: '#475569', bg: '#f1f5f9' },
  pending: { label: 'Pending', color: '#b45309', bg: '#fef3c7' },
  processing: { label: 'Processing', color: '#0369a1', bg: '#e0f2fe' },
  shipped: { label: 'Shipped', color: '#4338ca', bg: '#e0e7ff' },
  delivered: { label: 'Delivered', color: '#15803d', bg: '#dcfce7' },
  cancelled: { label: 'Cancelled', color: '#b91c1c', bg: '#fee2e2' },
};

export default function Ecommerce() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tab navigation: 'orders' | 'catalog' | 'couriers' | 'analytics'
  const [activeTab, setActiveTab] = useState('orders');

  // Filters for Orders tab
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [courierFilter, setCourierFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Catalog search & filter
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogStockFilter, setCatalogStockFilter] = useState('all');

  // Modals state
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isStorefrontModalOpen, setIsStorefrontModalOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [printOrder, setPrintOrder] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [orderRes, prodRes] = await Promise.all([
        fetch(`${API}/ecommerce/orders`).catch(() => null),
        fetch(`${API}/master/products`).catch(() => null),
      ]);

      if (orderRes && orderRes.ok) {
        const oData = await orderRes.json();
        setOrders(oData.data || (Array.isArray(oData) ? oData : []));
      }
      if (prodRes && prodRes.ok) {
        const pData = await prodRes.json();
        setProducts(pData.data || (Array.isArray(pData) ? pData : []));
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load e-commerce orders or catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Quick order status update from table
  const handleQuickStatusChange = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API}/ecommerce/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      if (data.success) {
        loadData();
      } else {
        alert(data.message || 'Failed to update order status');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let pendingCount = 0;
    let processingCount = 0;
    let shippedCount = 0;
    let deliveredCount = 0;
    let cancelledCount = 0;

    orders.forEach((o) => {
      const status = (o.order_status || 'pending').toLowerCase();
      if (status !== 'cancelled') {
        totalRevenue += money(o.total_amount);
      }
      if (status === 'pending') pendingCount++;
      else if (status === 'processing') processingCount++;
      else if (status === 'shipped') shippedCount++;
      else if (status === 'delivered') deliveredCount++;
      else if (status === 'cancelled') cancelledCount++;
    });

    const activeFulfillment = pendingCount + processingCount;
    const completedOrders = deliveredCount;
    const totalValid = orders.length - cancelledCount;
    const fulfillmentRate = totalValid > 0 ? ((completedOrders / totalValid) * 100).toFixed(0) : '0';

    return {
      totalRevenue,
      totalOrders: orders.length,
      pendingCount,
      processingCount,
      activeFulfillment,
      shippedCount,
      deliveredCount,
      cancelledCount,
      fulfillmentRate,
    };
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const status = (o.order_status || 'pending').toLowerCase();
      if (statusFilter !== 'all' && status !== statusFilter) return false;

      if (courierFilter !== 'all') {
        const courier = (o.courier_name || '').toLowerCase();
        if (!courier.includes(courierFilter.toLowerCase())) return false;
      }

      if (paymentFilter !== 'all') {
        const pay = (o.payment_status || 'unpaid').toLowerCase();
        if (paymentFilter === 'paid' && pay !== 'paid') return false;
        if (paymentFilter === 'unpaid' && pay === 'paid') return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNo = String(o.order_no || o.order_number || o.id).toLowerCase().includes(q);
        const matchName = String(o.customer_name || '').toLowerCase().includes(q);
        const matchPhone = String(o.customer_phone || '').toLowerCase().includes(q);
        const matchAddr = String(o.shipping_address || '').toLowerCase().includes(q);
        const matchTrack = String(o.tracking_code || '').toLowerCase().includes(q);
        const matchItem = (o.items || []).some((it) =>
          String(it.product_name || '').toLowerCase().includes(q)
        );
        if (!matchNo && !matchName && !matchPhone && !matchAddr && !matchTrack && !matchItem) {
          return false;
        }
      }

      return true;
    });
  }, [orders, statusFilter, courierFilter, paymentFilter, searchQuery]);

  // Filtered Products for Live Store Catalog
  const filteredCatalog = useMemo(() => {
    return products.filter((p) => {
      const stock = Number(p.stock || 0);
      if (catalogStockFilter === 'instock' && stock <= 0) return false;
      if (catalogStockFilter === 'lowstock' && (stock <= 0 || stock > 5)) return false;
      if (catalogStockFilter === 'outofstock' && stock > 0) return false;

      if (catalogSearch.trim()) {
        const q = catalogSearch.toLowerCase().trim();
        const matchName = String(p.name || '').toLowerCase().includes(q);
        const matchSku = String(p.sku || '').toLowerCase().includes(q);
        const matchBrand = String(p.brand_name || '').toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchBrand) return false;
      }
      return true;
    });
  }, [products, catalogStockFilter, catalogSearch]);

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* 1. Consolidated Header, Tabs & Action Buttons in a Single Sleek Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '10px',
          paddingBottom: '8px',
          borderBottom: '1.5px solid #e2e8f0',
        }}
      >
        {/* Left: Compact Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.3rem' }}>🌐</span>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              E-Commerce &amp; Online Orders
            </h1>
          </div>
        </div>

        {/* Center: Inline Tabs */}
        <div
          style={{
            display: 'flex',
            background: '#f1f5f9',
            padding: '3px',
            borderRadius: '8px',
            gap: '3px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'orders' ? '#0d9488' : 'transparent',
              color: activeTab === 'orders' ? '#ffffff' : '#64748b',
              fontWeight: activeTab === 'orders' ? 700 : 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Orders</span>
            <span
              style={{
                background: activeTab === 'orders' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                color: activeTab === 'orders' ? '#ffffff' : '#475569',
                padding: '1px 6px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 700,
              }}
            >
              {orders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'catalog' ? '#0d9488' : 'transparent',
              color: activeTab === 'catalog' ? '#ffffff' : '#64748b',
              fontWeight: activeTab === 'catalog' ? 700 : 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Catalog</span>
            <span
              style={{
                background: activeTab === 'catalog' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                color: activeTab === 'catalog' ? '#ffffff' : '#475569',
                padding: '1px 6px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 700,
              }}
            >
              {products.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('couriers')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'couriers' ? '#0d9488' : 'transparent',
              color: activeTab === 'couriers' ? '#ffffff' : '#64748b',
              fontWeight: activeTab === 'couriers' ? 700 : 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Couriers</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'analytics' ? '#0d9488' : 'transparent',
              color: activeTab === 'analytics' ? '#ffffff' : '#64748b',
              fontWeight: activeTab === 'analytics' ? 700 : 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Analytics</span>
          </button>
        </div>

        {/* Right: Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={loadData}
            title="Refresh orders and stock"
            style={{
              padding: '5px 10px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              color: '#334155',
              fontWeight: 600,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            🔄 Refresh
          </button>

          <button
            type="button"
            onClick={() => setIsStorefrontModalOpen(true)}
            style={{
              padding: '5px 12px',
              background: '#f0fdfa',
              border: '1px solid #0d9488',
              borderRadius: '6px',
              color: '#0d9488',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            🛍️ Storefront
          </button>

          <button
            type="button"
            onClick={() => setIsNewOrderModalOpen(true)}
            style={{
              background: '#0d9488',
              color: '#ffffff',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 4px rgba(13, 148, 136, 0.2)',
            }}
          >
            <span>+</span> New Order
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '8px 12px', background: '#fee2e2', color: '#b91c1c', borderRadius: '6px', marginBottom: '10px', border: '1px solid #fecaca', fontSize: '0.82rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* 4 Analytics KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', marginBottom: '10px' }}>
        {/* Card 1: Online Revenue */}
        <div style={{ background: '#ffffff', borderRadius: '8px', padding: '8px 12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
              Online Revenue
            </span>
            <span style={{ padding: '2px 6px', background: '#f0fdfa', borderRadius: '4px', color: '#0d9488', fontSize: '0.72rem', fontWeight: 700 }}>
              ৳ Net
            </span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>
            {taka(stats.totalRevenue)}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 600 }}>
            ✓ {stats.totalOrders} total orders
          </div>
        </div>

        {/* Card 2: Orders Total */}
        <div style={{ background: '#ffffff', borderRadius: '8px', padding: '8px 12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
              Total Orders
            </span>
            <span style={{ padding: '2px 6px', background: '#f1f5f9', borderRadius: '4px', color: '#475569', fontSize: '0.72rem', fontWeight: 700 }}>
              📦 Orders
            </span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>
            {stats.totalOrders}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
            {stats.cancelledCount} cancelled / returned
          </div>
        </div>

        {/* Card 3: Pending & Processing */}
        <div style={{ background: '#ffffff', borderRadius: '8px', padding: '8px 12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase' }}>
              Pending Fulfillment
            </span>
            <span style={{ padding: '2px 6px', background: '#fef3c7', borderRadius: '4px', color: '#b45309', fontSize: '0.72rem', fontWeight: 800 }}>
              Action Req
            </span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#b45309', marginTop: '2px' }}>
            {stats.activeFulfillment}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
            {stats.pendingCount} pending · {stats.processingCount} packing
          </div>
        </div>

        {/* Card 4: Delivered & Rate */}
        <div style={{ background: '#ffffff', borderRadius: '8px', padding: '8px 12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase' }}>
              Delivered Successfully
            </span>
            <span style={{ padding: '2px 6px', background: '#dcfce7', borderRadius: '4px', color: '#15803d', fontSize: '0.72rem', fontWeight: 700 }}>
              {stats.fulfillmentRate}%
            </span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#15803d', marginTop: '2px' }}>
            {stats.deliveredCount}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
            {stats.shippedCount} out for delivery
          </div>
        </div>
      </div>

      {/* TAB 1: ORDERS & SHIPMENTS */}
      {activeTab === 'orders' && (
        <div>
          {/* Status Filter Badges / Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
            {Object.keys(STATUS_CONFIG).map((st) => {
              const cfg = STATUS_CONFIG[st];
              const count =
                st === 'all'
                  ? orders.length
                  : orders.filter((o) => (o.order_status || 'pending').toLowerCase() === st).length;
              const isActive = statusFilter === st;

              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: isActive ? `1.5px solid ${cfg.color}` : '1px solid #cbd5e1',
                    background: isActive ? cfg.bg : '#ffffff',
                    color: isActive ? cfg.color : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{cfg.label}</span>
                  <span
                    style={{
                      padding: '1px 5px',
                      borderRadius: '999px',
                      background: isActive ? '#ffffff' : '#f1f5f9',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search and Secondary Filters Bar */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '10px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Search Order #, Customer, Phone, Tracking..."
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <select
                value={courierFilter}
                onChange={(e) => setCourierFilter(e.target.value)}
                style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', background: '#ffffff' }}
              >
                <option value="all">All Couriers</option>
                <option value="Steadfast">Steadfast Courier</option>
                <option value="Pathao">Pathao Courier</option>
                <option value="RedX">RedX Delivery</option>
                <option value="Sundarban">Sundarban Courier</option>
                <option value="Paperfly">Paperfly</option>
                <option value="In-house">In-house / Merchant</option>
              </select>

              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', background: '#ffffff' }}
              >
                <option value="all">All Payments</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid / COD</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            {loading ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '8px' }}>⏳</span>
                Loading e-commerce orders...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8' }}>
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}>📦</span>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem', color: '#475569' }}>
                  No online orders match your filters
                </p>
                <p style={{ margin: '4px 0 16px 0', fontSize: '0.85rem' }}>
                  Create an online order or adjust your search and status filters above.
                </p>
                <button
                  type="button"
                  onClick={() => setIsNewOrderModalOpen(true)}
                  style={{
                    padding: '8px 18px',
                    background: '#0d9488',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  + Create First Online Order
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: '#0f172a', color: '#ffffff', fontSize: '0.76rem', fontWeight: 800, letterSpacing: '0.04em' }}>
                      <th style={{ padding: '12px 14px' }}>ORDER # &amp; DATE</th>
                      <th style={{ padding: '12px 14px' }}>CUSTOMER</th>
                      <th style={{ padding: '12px 14px' }}>ITEMS</th>
                      <th style={{ padding: '12px 14px' }}>SHIPPING &amp; COURIER</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>PAYMENT</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>TOTAL</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>STATUS</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center', width: '130px' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((o, idx) => {
                      const status = (o.order_status || 'pending').toLowerCase();
                      const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
                      const isPaid = (o.payment_status || '').toLowerCase() === 'paid';
                      const itemsCount = (o.items || []).reduce((acc, it) => acc + Number(it.quantity || 1), 0);

                      // Raw phone for WhatsApp
                      const rawPhone = (o.customer_phone || '').replace(/[^0-9]/g, '');
                      const bdPhone = rawPhone.startsWith('880') ? rawPhone : (rawPhone.startsWith('0') ? `88${rawPhone}` : `880${rawPhone}`);
                      const waUrl = `https://wa.me/${bdPhone}?text=Hello%20${encodeURIComponent(o.customer_name || 'Customer')},%20regarding%20order%20%23${encodeURIComponent(o.order_no || o.id)}`;

                      return (
                        <tr
                          key={o.id}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            background: idx % 2 === 0 ? '#ffffff' : '#fcfcfd',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? '#ffffff' : '#fcfcfd')}
                        >
                          {/* ORDER # & DATE */}
                          <td style={{ padding: '12px 14px' }}>
                            <div
                              onClick={() => setSelectedOrderDetails(o)}
                              style={{ fontWeight: 800, color: '#0d9488', cursor: 'pointer' }}
                            >
                              #{o.order_no || o.order_number || o.id}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                              {o.created_at ? new Date(o.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                            </div>
                          </td>

                          {/* CUSTOMER & CONTACTS */}
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{o.customer_name}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                              <span style={{ fontSize: '0.78rem', color: '#475569' }}>{o.customer_phone}</span>
                              <a
                                href={`tel:${o.customer_phone}`}
                                title="Call customer"
                                style={{ fontSize: '0.72rem', textDecoration: 'none', padding: '1px 5px', background: '#f1f5f9', borderRadius: '4px', color: '#0284c7' }}
                              >
                                📞
                              </a>
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Send WhatsApp Message"
                                style={{ fontSize: '0.72rem', textDecoration: 'none', padding: '1px 5px', background: '#dcfce7', borderRadius: '4px', color: '#16a34a' }}
                              >
                                💬
                              </a>
                            </div>
                          </td>

                          {/* ITEMS SUMMARY */}
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>
                              {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#64748b', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {(o.items || []).map((it) => `${it.product_name || 'Product'} (x${it.quantity})`).join(', ') || 'Online package'}
                            </div>
                          </td>

                          {/* SHIPPING & COURIER */}
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                              🚚 {o.courier_name || 'Standard Courier'}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              📍 {o.shipping_address}
                            </div>
                            {o.tracking_code && (
                              <div style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 700, marginTop: '2px' }}>
                                CN: {o.tracking_code}
                              </div>
                            )}
                          </td>

                          {/* PAYMENT */}
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                background: isPaid ? '#dcfce7' : '#fef3c7',
                                color: isPaid ? '#15803d' : '#b45309',
                              }}
                            >
                              {isPaid ? '✓ Paid' : (o.payment_method ? `${o.payment_method.toUpperCase()} / COD` : 'COD')}
                            </span>
                          </td>

                          {/* TOTAL */}
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                            {taka(o.total_amount)}
                          </td>

                          {/* STATUS DROPDOWN */}
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <select
                              value={status}
                              onChange={(e) => handleQuickStatusChange(o.id, e.target.value)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '0.76rem',
                                fontWeight: 800,
                                border: `1px solid ${statusCfg.color}`,
                                background: statusCfg.bg,
                                color: statusCfg.color,
                                cursor: 'pointer',
                                outline: 'none',
                              }}
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>

                          {/* ACTIONS */}
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => setSelectedOrderDetails(o)}
                                title="View full order details"
                                style={{
                                  padding: '4px 8px',
                                  background: '#f1f5f9',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '5px',
                                  fontSize: '0.76rem',
                                  fontWeight: 700,
                                  color: '#334155',
                                  cursor: 'pointer',
                                }}
                              >
                                View
                              </button>

                              <button
                                type="button"
                                onClick={() => setPrintOrder(o)}
                                title="Print Packing Slip / Label"
                                style={{
                                  padding: '4px 8px',
                                  background: '#f0fdfa',
                                  border: '1px solid #99f6e4',
                                  borderRadius: '5px',
                                  fontSize: '0.76rem',
                                  fontWeight: 700,
                                  color: '#0d9488',
                                  cursor: 'pointer',
                                }}
                              >
                                🖨️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: LIVE STORE CATALOG */}
      {activeTab === 'catalog' && (
        <div>
          {/* Catalog Filter Header */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              padding: '14px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ flex: 1, minWidth: '240px' }}>
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="🔍 Search catalog by product name, SKU, brand..."
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <select
                value={catalogStockFilter}
                onChange={(e) => setCatalogStockFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              >
                <option value="all">All Stock Statuses</option>
                <option value="instock">In Stock (Stock &gt; 0)</option>
                <option value="lowstock">Low Stock (Stock ≤ 5)</option>
                <option value="outofstock">Out of Stock</option>
              </select>

              <button
                type="button"
                onClick={() => setIsNewOrderModalOpen(true)}
                style={{
                  padding: '8px 16px',
                  background: '#0d9488',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                + Create Order with Product
              </button>
            </div>
          </div>

          {/* Product Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {filteredCatalog.map((p) => {
              const stock = Number(p.stock || 0);
              const isOut = stock <= 0;
              const isLow = stock > 0 && stock <= 5;

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
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                  }}
                >
                  <div>
                    {/* Header: SKU & Stock Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                        SKU: {p.sku || 'N/A'}
                      </span>
                      <span
                        style={{
                          padding: '2px 7px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          background: isOut ? '#fee2e2' : isLow ? '#fef3c7' : '#dcfce7',
                          color: isOut ? '#b91c1c' : isLow ? '#b45309' : '#15803d',
                        }}
                      >
                        {isOut ? 'Out of Stock' : isLow ? `Low (${stock})` : `In Stock (${stock})`}
                      </span>
                    </div>

                    {/* Product Name */}
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a', lineHeight: '1.3', marginBottom: '6px' }}>
                      {p.name}
                    </div>

                    {p.brand_name && (
                      <div style={{ fontSize: '0.76rem', color: '#64748b', marginBottom: '8px' }}>
                        Brand: <strong>{p.brand_name}</strong>
                      </div>
                    )}
                  </div>

                  {/* Pricing & Action */}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Selling Price</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#16a34a' }}>
                        {taka(p.selling_price || p.purchase_price || 0)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsNewOrderModalOpen(true)}
                      style={{
                        padding: '6px 10px',
                        background: '#f0fdfa',
                        border: '1px solid #99f6e4',
                        color: '#0d9488',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      + Order
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: COURIERS & LOGISTICS */}
      {activeTab === 'couriers' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {/* Steadfast Courier */}
            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Steadfast Courier</span>
                <span style={{ padding: '2px 8px', background: '#ecfdf5', color: '#047857', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                  Active Partner
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 12px 0' }}>
                Fastest countrywide cash on delivery with automated next-day payment settlement.
              </p>
              <div style={{ fontSize: '0.82rem', color: '#334155', marginBottom: '14px' }}>
                <div>📍 Inside Dhaka: <strong>৳80</strong></div>
                <div>📍 Outside Dhaka: <strong>৳150</strong></div>
              </div>
              <a
                href="https://steadfast.com.bd/tracking"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '7px 14px',
                  background: '#f1f5f9',
                  color: '#0284c7',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}
              >
                🔗 Steadfast Parcel Tracking Portal
              </a>
            </div>

            {/* Pathao Courier */}
            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Pathao Courier</span>
                <span style={{ padding: '2px 8px', background: '#ecfdf5', color: '#047857', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                  Active Partner
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 12px 0' }}>
                On-demand express parcel booking across all 64 districts in Bangladesh.
              </p>
              <div style={{ fontSize: '0.82rem', color: '#334155', marginBottom: '14px' }}>
                <div>⚡ Express Delivery: <strong>৳120</strong></div>
                <div>📍 Standard Delivery: <strong>৳80 - ৳140</strong></div>
              </div>
              <a
                href="https://pathao.com/courier/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '7px 14px',
                  background: '#f1f5f9',
                  color: '#0284c7',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}
              >
                🔗 Pathao Courier Dashboard
              </a>
            </div>

            {/* RedX Delivery */}
            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>RedX Logistics</span>
                <span style={{ padding: '2px 8px', background: '#ecfdf5', color: '#047857', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                  Active Partner
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 12px 0' }}>
                Extensive nationwide distribution network with doorstep parcel pickup.
              </p>
              <div style={{ fontSize: '0.82rem', color: '#334155', marginBottom: '14px' }}>
                <div>📍 Standard Fee: <strong>৳100 - ৳130</strong></div>
                <div>🛡️ COD Return Protection: Included</div>
              </div>
              <a
                href="https://redx.com.bd/track-order"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '7px 14px',
                  background: '#f1f5f9',
                  color: '#0284c7',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}
              >
                🔗 RedX Tracking Tool
              </a>
            </div>

            {/* Sundarban Courier */}
            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Sundarban Courier</span>
                <span style={{ padding: '2px 8px', background: '#f1f5f9', color: '#475569', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                  Branch / Condition
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 12px 0' }}>
                Traditional branch-to-branch condition delivery for heavy hardware &amp; bulk CCTV systems.
              </p>
              <div style={{ fontSize: '0.82rem', color: '#334155', marginBottom: '14px' }}>
                <div>📦 Bulk Hardware: <strong>৳150 - ৳350</strong></div>
                <div>🏢 Branch Condition Cash Collection</div>
              </div>
              <a
                href="https://sundarbancourierltd.com/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '7px 14px',
                  background: '#f1f5f9',
                  color: '#0284c7',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}
              >
                🔗 Sundarban Tracking
              </a>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ANALYTICS & INSIGHTS */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Status Breakdown Box */}
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
              Order Fulfillment Pipeline
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Pending Review', count: stats.pendingCount, color: '#b45309', bg: '#fef3c7' },
                { label: 'Processing & Packing', count: stats.processingCount, color: '#0369a1', bg: '#e0f2fe' },
                { label: 'Shipped & Out for Delivery', count: stats.shippedCount, color: '#4338ca', bg: '#e0e7ff' },
                { label: 'Delivered & Completed', count: stats.deliveredCount, color: '#15803d', bg: '#dcfce7' },
                { label: 'Cancelled / Returned', count: stats.cancelledCount, color: '#b91c1c', bg: '#fee2e2' },
              ].map((item) => {
                const pct = stats.totalOrders > 0 ? ((item.count / stats.totalOrders) * 100).toFixed(1) : 0;
                return (
                  <div key={item.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, color: '#334155' }}>{item.label}</span>
                      <span style={{ fontWeight: 700, color: item.color }}>
                        {item.count} ({pct}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: item.color, borderRadius: '4px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Metrics & Summary */}
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
              Performance Metrics
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                  Average Order Value (AOV)
                </span>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>
                  {stats.totalOrders > 0 ? taka(stats.totalRevenue / (stats.totalOrders - stats.cancelledCount || 1)) : taka(0)}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                  Active Inventory Count
                </span>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>
                  {products.length} Products
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                  Fulfillment Success Rate
                </span>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#15803d', marginTop: '4px' }}>
                  {stats.fulfillmentRate}%
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                  Return / Cancel Rate
                </span>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: stats.cancelledCount > 0 ? '#b91c1c' : '#64748b', marginTop: '4px' }}>
                  {stats.totalOrders > 0 ? `${((stats.cancelledCount / stats.totalOrders) * 100).toFixed(1)}%` : '0%'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: New Online Order */}
      <EcommerceNewOrderModal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        products={products}
        onOrderCreated={loadData}
      />

      {/* MODAL: Order Details Drawer */}
      <EcommerceOrderDetailsModal
        isOpen={Boolean(selectedOrderDetails)}
        onClose={() => setSelectedOrderDetails(null)}
        order={selectedOrderDetails}
        onOrderUpdated={() => {
          loadData();
          // also refresh selected order details from updated list
          setSelectedOrderDetails(null);
        }}
        onOpenPrint={(ord) => {
          setSelectedOrderDetails(null);
          setPrintOrder(ord);
        }}
      />

      {/* MODAL: Printable Invoice & Thermal Label */}
      <EcommercePrintModal
        isOpen={Boolean(printOrder)}
        onClose={() => setPrintOrder(null)}
        order={printOrder}
      />

      {/* MODAL: Customer Public Storefront & Parcel Tracking Portal */}
      <CustomerStorefrontModal
        isOpen={isStorefrontModalOpen}
        onClose={() => setIsStorefrontModalOpen(false)}
        products={products}
        onOrderPlaced={loadData}
      />
    </div>
  );
}
