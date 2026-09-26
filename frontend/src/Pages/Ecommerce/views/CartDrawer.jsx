import React from 'react';
import BDPhoneInput from '../../../components/shared/BDPhoneInput';

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
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
  cartSubtotal,
  cartGrandTotal,
  COURIER_PRESETS,
  taka,
}) {
  if (!isOpen) return null;

  return (
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
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <strong style={{ fontSize: '1rem', color: '#0f172a' }}>
          🛒 Your Order Cart ({cart.length})
        </strong>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            fontSize: '1rem',
            cursor: 'pointer',
          }}
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
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        background: '#f8fafc',
                        cursor: 'pointer',
                        fontWeight: 800,
                      }}
                    >
                      -
                    </button>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        minWidth: '16px',
                        textAlign: 'center',
                      }}
                    >
                      {it.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateCartQty(it.product_id, 1)}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        background: '#f8fafc',
                        cursor: 'pointer',
                        fontWeight: 800,
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Checkout Form */}
            <div
              style={{
                background: '#f8fafc',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: '#0d9488',
                  textTransform: 'uppercase',
                  marginBottom: '10px',
                }}
              >
                Delivery &amp; Checkout Details
              </div>

              {checkoutError && (
                <div
                  style={{
                    padding: '8px 10px',
                    background: '#fee2e2',
                    color: '#b91c1c',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    marginBottom: '8px',
                  }}
                >
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
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '8px' }}>
                <BDPhoneInput
                  required
                  placeholder="1X-XXXXXXXX"
                  value={checkoutPhone}
                  onChange={(e) => setCheckoutPhone(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '8px' }}>
                <textarea
                  required
                  rows={2}
                  placeholder="Full Delivery Address *"
                  value={checkoutAddress}
                  onChange={(e) => setCheckoutAddress(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '8px' }}>
                <label
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#64748b',
                    display: 'block',
                    marginBottom: '2px',
                  }}
                >
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
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.8rem',
                  }}
                >
                  {COURIER_PRESETS.map((p) => (
                    <option key={p.label} value={p.label}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#64748b',
                    display: 'block',
                    marginBottom: '2px',
                  }}
                >
                  Payment Method
                </label>
                <select
                  value={checkoutPaymentMethod}
                  onChange={(e) => setCheckoutPaymentMethod(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.8rem',
                  }}
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
        <div
          style={{
            padding: '14px 18px',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.82rem',
              color: '#64748b',
              marginBottom: '4px',
            }}
          >
            <span>Items Subtotal:</span>
            <span>{taka(cartSubtotal)}</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.82rem',
              color: '#64748b',
              marginBottom: '8px',
            }}
          >
            <span>Delivery Fee:</span>
            <span>{taka(checkoutDeliveryFee)}</span>
          </div>
          <div
            style={{
              borderTop: '1px solid #e2e8f0',
              paddingTop: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '1.05rem',
              fontWeight: 900,
              color: '#0f172a',
              marginBottom: '12px',
            }}
          >
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
  );
}
