import React, { useState, useEffect } from 'react';
import EcommerceOrderDetailsModal from './modals/EcommerceOrderDetailsModal';
import EcommerceNewOrderModal from './modals/EcommerceNewOrderModal';
import EcommercePrintModal from './modals/EcommercePrintModal';
import CustomerStorefrontModal from './modals/CustomerStorefrontModal';
import SaleQuotationModal from '../Sales/modals/SaleQuotationModal';
import useEcommerceManager from './hooks/useEcommerceManager';
import KpiSummaryCards from './views/KpiSummaryCards';
import OrdersTab from './views/OrdersTab';
import CatalogTab from './views/CatalogTab';
import CouriersTab from './views/CouriersTab';
import AnalyticsTab from './views/AnalyticsTab';

export default function Ecommerce({ currentUser, isTechnician = false }) {
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [quotationInitialProduct, setQuotationInitialProduct] = useState(null);
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

  // For technicians, default to catalog to see prices and order directly
  useEffect(() => {
    if (isTechnician) {
      setActiveTab('catalog');
    }
  }, [isTechnician, setActiveTab]);

  return (
    <div className="min-h-screen p-6 bg-slate-50 font-sans">
      {/* 1. Consolidated Header, Tabs & Action Buttons in a Single Sleek Row */}
      <div className="flex justify-between items-center flex-wrap gap-2.5 mb-2.5 pb-2 border-b border-slate-200">
        {/* Left: Compact Title */}
        <div className="flex items-center gap-2">
          <span className="text-xl">🌐</span>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 m-0 tracking-tight leading-tight">
              E-Commerce &amp; Online Orders {isTechnician ? '(Catalog & Orders)' : ''}
            </h1>
          </div>
        </div>

        {/* Center: Inline Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`px-3 py-1.5 rounded-md text-xs cursor-pointer flex items-center gap-1.5 transition-colors ${
              activeTab === 'catalog'
                ? 'bg-teal-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 font-semibold'
            }`}
          >
            <span>Catalog</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
                activeTab === 'catalog' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {products.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 rounded-md text-xs cursor-pointer flex items-center gap-1.5 transition-colors ${
              activeTab === 'orders'
                ? 'bg-teal-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 font-semibold'
            }`}
          >
            <span>Orders</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
                activeTab === 'orders' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {orders.length}
            </span>
          </button>

          {!isTechnician && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('couriers')}
                className={`px-3 py-1.5 rounded-md text-xs cursor-pointer flex items-center gap-1.5 transition-colors ${
                  activeTab === 'couriers'
                    ? 'bg-teal-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 font-semibold'
                }`}
              >
                <span>Couriers</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className={`px-3 py-1.5 rounded-md text-xs cursor-pointer flex items-center gap-1.5 transition-colors ${
                  activeTab === 'analytics'
                    ? 'bg-teal-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 font-semibold'
                }`}
              >
                <span>Analytics</span>
              </button>
            </>
          )}
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={loadData}
            title="Refresh orders and stock"
            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-md text-slate-700 font-semibold text-xs cursor-pointer flex items-center gap-1 transition-colors shadow-xs"
          >
            🔄 Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              setQuotationInitialProduct(null);
              setIsQuotationModalOpen(true);
            }}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-500 rounded-md text-amber-800 font-bold text-xs cursor-pointer flex items-center gap-1 transition-colors shadow-xs"
            title="Create Official Customer Price Quotation"
          >
            📄 + Quotation
          </button>

          <button
            type="button"
            onClick={() => setIsStorefrontModalOpen(true)}
            className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 border border-teal-600 rounded-md text-teal-600 font-bold text-xs cursor-pointer flex items-center gap-1 transition-colors shadow-xs"
          >
            🛍️ Storefront
          </button>

          <button
            type="button"
            onClick={() => setIsNewOrderModalOpen(true)}
            className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-bold text-xs cursor-pointer flex items-center gap-1 transition-colors shadow-sm"
          >
            <span>+</span> New Order
          </button>
        </div>
      </div>

      {error && (
        <div className="p-2.5 bg-red-100 text-red-700 rounded-md mb-2.5 border border-red-200 text-xs">
          ⚠️ {error}
        </div>
      )}

      {/* 4 Analytics KPI Cards (Admin only) */}
      {!isTechnician && <KpiSummaryCards stats={stats} taka={taka} />}

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
          onOpenQuotation={(p) => {
            setQuotationInitialProduct(p);
            setIsQuotationModalOpen(true);
          }}
          taka={taka}
        />
      )}

      {/* TAB 3: COURIERS & LOGISTICS (Admin only) */}
      {!isTechnician && activeTab === 'couriers' && <CouriersTab />}

      {/* TAB 4: ANALYTICS & INSIGHTS (Admin only) */}
      {!isTechnician && activeTab === 'analytics' && (
        <AnalyticsTab stats={stats} products={products} taka={taka} />
      )}

      {/* MODAL: Customer Price Quotation */}
      <SaleQuotationModal
        isOpen={isQuotationModalOpen}
        onClose={() => {
          setIsQuotationModalOpen(false);
          setQuotationInitialProduct(null);
        }}
        products={products}
        initialProduct={quotationInitialProduct}
      />

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
