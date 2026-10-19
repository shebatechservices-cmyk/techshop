import React from 'react';
import useStorefrontManager from '../hooks/useStorefrontManager';
import CartDrawer from '../views/CartDrawer';
import StorefrontModalHeader from './storefront/StorefrontModalHeader';
import StorefrontViewContainer from './storefront/StorefrontViewContainer';

export default function CustomerStorefrontModal({ isOpen, onClose, products = [], onOrderPlaced }) {
  const manager = useStorefrontManager({ products, onOrderPlaced });

  const {
    activeView,
    setActiveView,
    cart,
    isCartOpen,
    setIsCartOpen,
    cartSubtotal,
    customer,
    taka,
    updateCartQty,
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
    checkoutError,
    placingOrder,
    handleCheckoutSubmit,
    cartGrandTotal,
    COURIER_PRESETS,
  } = manager;

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
          maxWidth: '1200px',
          height: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <StorefrontModalHeader
          activeView={activeView}
          setActiveView={setActiveView}
          customer={customer}
          cart={cart}
          isCartOpen={isCartOpen}
          setIsCartOpen={setIsCartOpen}
          cartSubtotal={cartSubtotal}
          taka={taka}
          onClose={onClose}
        />

        {/* View Content Area */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          <StorefrontViewContainer
            {...manager}
          />

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
