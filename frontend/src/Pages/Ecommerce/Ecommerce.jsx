import React from 'react';
import EcommerceOrderDetailsModal from './modals/EcommerceOrderDetailsModal';
import EcommerceNewOrderModal from './modals/EcommerceNewOrderModal';
import EcommercePrintModal from './modals/EcommercePrintModal';
import CustomerStorefrontModal from './modals/CustomerStorefrontModal';
import useEcommerceManager from './hooks/useEcommerceManager';
import KpiSummaryCards from './views/KpiSummaryCards';
import OrdersTab from './views/OrdersTab';
import CatalogTab from './views/CatalogTab';
import CouriersTab from './views/CouriersTab';
import AnalyticsTab from './views/AnalyticsTab';

export default function Ecommerce() {
  const {
    orders,
    products,
    loading,
    error,
    activeTab,
    setActiveTab,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    courierFilter,
    setCourierFilter,
    paymentFilter,
    setPaymentFilter,
    catalogSearch,
    setCatalogSearch,
    catalogStockFilter,
    setCatalogStockFilter,
    isNewOrderModalOpen,
    setIsNewOrderModalOpen,
    isStorefrontModalOpen,
    setIsStorefrontModalOpen,
    selectedOrderDetails,
    setSelectedOrderDetails,
    printOrder,
    setPrintOrder,
    loadData,
    handleQuickStatusChange,
    stats,
    filteredOrders,
    filteredCatalog,
    STATUS_CONFIG,
    taka,
  } = useEcommerceManager();

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
      <KpiSummaryCards stats={stats} taka={taka} />

      {/* TAB 1: ORDERS & SHIPMENTS */}
      {activeTab === 'orders' && (
        <OrdersTab
          orders={orders}
          filteredOrders={filteredOrders}
          loading={loading}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          courierFilter={courierFilter}
          setCourierFilter={setCourierFilter}
          paymentFilter={paymentFilter}
          setPaymentFilter={setPaymentFilter}
          STATUS_CONFIG={STATUS_CONFIG}
          handleQuickStatusChange={handleQuickStatusChange}
          setSelectedOrderDetails={setSelectedOrderDetails}
          setPrintOrder={setPrintOrder}
          setIsNewOrderModalOpen={setIsNewOrderModalOpen}
          taka={taka}
        />
      )}

      {/* TAB 2: LIVE STORE CATALOG */}
      {activeTab === 'catalog' && (
        <CatalogTab
          filteredCatalog={filteredCatalog}
          catalogSearch={catalogSearch}
          setCatalogSearch={setCatalogSearch}
          catalogStockFilter={catalogStockFilter}
          setCatalogStockFilter={setCatalogStockFilter}
          setIsNewOrderModalOpen={setIsNewOrderModalOpen}
          taka={taka}
        />
      )}

      {/* TAB 3: COURIERS & LOGISTICS */}
      {activeTab === 'couriers' && <CouriersTab />}

      {/* TAB 4: ANALYTICS & INSIGHTS */}
      {activeTab === 'analytics' && (
        <AnalyticsTab stats={stats} products={products} taka={taka} />
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
