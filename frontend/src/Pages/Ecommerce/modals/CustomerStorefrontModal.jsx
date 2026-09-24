import React from 'react';
import useStorefrontManager from '../hooks/useStorefrontManager';
import StorefrontView from '../views/StorefrontView';
import ParcelTrackingView from '../views/ParcelTrackingView';
import CustomerAccountView from '../views/CustomerAccountView';
import CartDrawer from '../views/CartDrawer';

export default function CustomerStorefrontModal({ isOpen, onClose, products = [], onOrderPlaced }) {
  const {
    // Navigation & Views
    activeView,
    setActiveView,

    // Cart State
    cart,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    updateCartQty,
    cartSubtotal,
    cartGrandTotal,

    // Customer & Auth State
    customer,
    authName,
    setAuthName,
    authPhone,
    setAuthPhone,
    authAddress,
    setAuthAddress,
    authEmail,
    setAuthEmail,
    authLoading,
    authMsg,
    handleAuthSubmit,
    handleCustomerLogout,

    // Checkout Form State
    checkoutName,
    setCheckoutName,
    checkoutPhone,
    setCheckoutPhone,
    checkoutAddress,
    setCheckoutAddress,
    checkoutCourier,
    setCheckoutCourier,
    checkoutDeliveryFee,
    setCheckoutDeliveryFee,
    checkoutPaymentMethod,
    setCheckoutPaymentMethod,
    placingOrder,
    checkoutError,
    handleCheckoutSubmit,

    // Tracking State
    trackQuery,
    setTrackQuery,
    trackingOrders,
    trackingLoading,
    trackingError,
    handleTrackSearch,

    // Catalog & Search
    storeSearch,
    setStoreSearch,
    filteredProducts,

    // Utilities & Constants
    COURIER_PRESETS,
    money,
    taka,
  } = useStorefrontManager({ products, onOrderPlaced });

  if (!isOpen) return null;

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
              <StorefrontView
                filteredProducts={filteredProducts}
                storeSearch={storeSearch}
                setStoreSearch={setStoreSearch}
                cart={cart}
                addToCart={addToCart}
                updateCartQty={updateCartQty}
                setActiveView={setActiveView}
                taka={taka}
              />
            )}

            {/* VIEW 2: PARCEL TRACKING */}
            {activeView === 'track' && (
              <ParcelTrackingView
                trackQuery={trackQuery}
                setTrackQuery={setTrackQuery}
                handleTrackSearch={handleTrackSearch}
                trackingLoading={trackingLoading}
                trackingError={trackingError}
                trackingOrders={trackingOrders}
                taka={taka}
                money={money}
              />
            )}

            {/* VIEW 3: CUSTOMER ACCOUNT / SIGN IN */}
            {activeView === 'account' && (
              <CustomerAccountView
                customer={customer}
                authName={authName}
                setAuthName={setAuthName}
                authPhone={authPhone}
                setAuthPhone={setAuthPhone}
                authAddress={authAddress}
                setAuthAddress={setAuthAddress}
                authEmail={authEmail}
                setAuthEmail={setAuthEmail}
                authLoading={authLoading}
                authMsg={authMsg}
                handleAuthSubmit={handleAuthSubmit}
                handleCustomerLogout={handleCustomerLogout}
                setActiveView={setActiveView}
                setTrackQuery={setTrackQuery}
                handleTrackSearch={handleTrackSearch}
              />
            )}
          </div>

          {/* Slide-out Cart & Checkout Drawer */}
          <CartDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            cart={cart}
            updateCartQty={updateCartQty}
            checkoutName={checkoutName}
            setCheckoutName={setCheckoutName}
            checkoutPhone={checkoutPhone}
            setCheckoutPhone={setCheckoutPhone}
            checkoutAddress={checkoutAddress}
            setCheckoutAddress={setCheckoutAddress}
            checkoutCourier={checkoutCourier}
            setCheckoutCourier={setCheckoutCourier}
            checkoutDeliveryFee={checkoutDeliveryFee}
            setCheckoutDeliveryFee={setCheckoutDeliveryFee}
            checkoutPaymentMethod={checkoutPaymentMethod}
            setCheckoutPaymentMethod={setCheckoutPaymentMethod}
            checkoutError={checkoutError}
            placingOrder={placingOrder}
            handleCheckoutSubmit={handleCheckoutSubmit}
            cartSubtotal={cartSubtotal}
            cartGrandTotal={cartGrandTotal}
            COURIER_PRESETS={COURIER_PRESETS}
            taka={taka}
          />
        </div>
      </div>
    </div>
  );
}
