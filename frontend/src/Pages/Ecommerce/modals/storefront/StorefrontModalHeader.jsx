import React from 'react';

export default function StorefrontModalHeader({
  activeView,
  setActiveView,
  customer,
  cart,
  isCartOpen,
  setIsCartOpen,
  cartSubtotal,
  taka,
  onClose,
}) {
  return (
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
            <div
              style={{
                fontWeight: 900,
                fontSize: '1.15rem',
                letterSpacing: '-0.02em',
                color: '#ffffff',
              }}
            >
              SHEBA ONLINE STORE
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              Customer Storefront &amp; Live Parcel Tracking Portal
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            background: '#1e293b',
            borderRadius: '8px',
            padding: '3px',
            marginLeft: '16px',
          }}
        >
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
  );
}
