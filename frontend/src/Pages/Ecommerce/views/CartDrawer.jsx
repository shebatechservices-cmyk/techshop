import React from 'react';
import BangladeshiPhoneInput from '../../../components/ui/BangladeshiPhoneInput';

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
    <div className="w-[360px] bg-white border-l border-slate-200 flex flex-col h-full shadow-[-4px_0_20px_rgba(0,0,0,0.06)] z-10">
      {/* Drawer Header */}
      <div className="px-4.5 py-3.5 border-b border-slate-200 flex justify-between items-center">
        <strong className="text-base text-slate-900">
          🛒 Your Order Cart ({cart.length})
        </strong>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-500 hover:text-slate-700 text-base cursor-pointer p-1 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto px-4.5 py-3.5">
        {cart.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <span className="text-3xl block mb-2">🛍️</span>
            Your cart is empty. Add products from the storefront to place an order!
          </div>
        ) : (
          <>
            <div className="space-y-1 mb-4">
              {cart.map((it) => (
                <div
                  key={it.product_id}
                  className="flex justify-between items-center py-2 border-b border-slate-100"
                >
                  <div className="flex-1 pr-2">
                    <div className="font-semibold text-xs text-slate-900">
                      {it.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {taka(it.price)} × {it.quantity}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateCartQty(it.product_id, -1)}
                      className="w-6 h-6 rounded border border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer font-extrabold text-xs flex items-center justify-center transition-colors"
                    >
                      -
                    </button>
                    <span className="font-bold text-xs min-w-[16px] text-center">
                      {it.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateCartQty(it.product_id, 1)}
                      className="w-6 h-6 rounded border border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer font-extrabold text-xs flex items-center justify-center transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Checkout Form */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 mb-4 shadow-xs">
              <div className="text-xs font-extrabold text-teal-600 uppercase tracking-wide mb-2.5">
                Delivery &amp; Checkout Details
              </div>

              {checkoutError && (
                <div className="p-2 bg-red-100 text-red-700 rounded-md text-xs mb-2">
                  ⚠️ {checkoutError}
                </div>
              )}

              <div className="mb-2">
                <input
                  type="text"
                  required
                  placeholder="Your Name *"
                  value={checkoutName}
                  onChange={(e) => setCheckoutName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs outline-none focus:border-teal-500 box-border bg-white"
                />
              </div>

              <div className="mb-2">
                <BangladeshiPhoneInput
                  required
                  placeholder="1X-XXXXXXXX"
                  value={checkoutPhone}
                  onChange={(e) => setCheckoutPhone(e.target.value)}
                />
              </div>

              <div className="mb-2">
                <textarea
                  required
                  rows={2}
                  placeholder="Full Delivery Address *"
                  value={checkoutAddress}
                  onChange={(e) => setCheckoutAddress(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs outline-none focus:border-teal-500 box-border bg-white"
                />
              </div>

              <div className="mb-2">
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
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
                  className="w-full px-2 py-1.5 rounded-md border border-slate-300 text-xs outline-none focus:border-teal-500 bg-white"
                >
                  {COURIER_PRESETS.map((p) => (
                    <option key={p.label} value={p.label}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Payment Method
                </label>
                <select
                  value={checkoutPaymentMethod}
                  onChange={(e) => setCheckoutPaymentMethod(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-md border border-slate-300 text-xs outline-none focus:border-teal-500 bg-white"
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
        <div className="px-4.5 py-3.5 border-t border-slate-200 bg-slate-50">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Items Subtotal:</span>
            <span>{taka(cartSubtotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-500 mb-2">
            <span>Delivery Fee:</span>
            <span>{taka(checkoutDeliveryFee)}</span>
          </div>
          <div className="border-t border-slate-200 pt-1.5 flex justify-between text-base font-black text-slate-900 mb-3">
            <span>Total Payable:</span>
            <span className="text-teal-600">{taka(cartGrandTotal)}</span>
          </div>

          <button
            type="button"
            onClick={handleCheckoutSubmit}
            disabled={placingOrder}
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-extrabold text-sm cursor-pointer shadow-md transition-colors disabled:cursor-not-allowed disabled:opacity-70"
          >
            {placingOrder ? 'Submitting Order...' : '✓ Confirm & Place Order'}
          </button>
        </div>
      )}
    </div>
  );
}
