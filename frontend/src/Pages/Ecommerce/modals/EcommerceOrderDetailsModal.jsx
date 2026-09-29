import React, { useState } from 'react';
import API from '../../../services/api';

const money = (val) => Number.parseFloat(val || 0) || 0;
const taka = (val) => `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const COURIER_OPTIONS = [
  'Steadfast Courier',
  'Pathao Courier',
  'RedX Delivery',
  'Sundarban Courier',
  'Paperfly',
  'eCourier',
  'In-house / Merchant Delivery',
];

const STATUS_STEPS = [
  { key: 'pending', label: 'Pending', icon: '⏳', desc: 'Order received, awaiting review' },
  { key: 'processing', label: 'Processing', icon: '📦', desc: 'Items being picked & packed' },
  { key: 'shipped', label: 'Shipped', icon: '🚚', desc: 'Handed to courier for delivery' },
  { key: 'delivered', label: 'Delivered', icon: '✅', desc: 'Delivered to customer' },
];

const STATUS_BADGES = {
  delivered: 'bg-emerald-100 text-emerald-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  processing: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-red-100 text-red-700',
  pending: 'bg-slate-100 text-slate-700',
};

export default function EcommerceOrderDetailsModal({
  isOpen,
  onClose,
  order,
  onOrderUpdated,
  onOpenPrint,
}) {
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [courierName, setCourierName] = useState(order?.courier_name || '');
  const [trackingCode, setTrackingCode] = useState(order?.tracking_code || '');
  const [paymentStatus, setPaymentStatus] = useState(order?.payment_status || 'unpaid');
  const [savingDetails, setSavingDetails] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen || !order) return null;

  const currentStatus = (order.order_status || 'pending').toLowerCase();
  const isCancelled = currentStatus === 'cancelled';

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleStatusChange = async (newStatus) => {
    if (updatingStatus || newStatus === currentStatus) return;
    try {
      setUpdatingStatus(true);
      setError('');
      const res = await fetch(`${API}/ecommerce/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showSuccess(`Status changed to ${newStatus.toUpperCase()}`);
        if (onOrderUpdated) onOrderUpdated();
      } else {
        setError(data.message || 'Failed to update order status');
      }
    } catch (err) {
      setError(err.message || 'Connection error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveCourierAndPayment = async (e) => {
    e.preventDefault();
    try {
      setSavingDetails(true);
      setError('');
      const res = await fetch(`${API}/ecommerce/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courier_name: courierName,
          tracking_code: trackingCode,
          payment_status: paymentStatus,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showSuccess('Courier and payment information saved!');
        if (onOrderUpdated) onOrderUpdated();
      } else {
        setError(data.message || 'Failed to update details');
      }
    } catch (err) {
      setError(err.message || 'Connection error');
    } finally {
      setSavingDetails(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!window.confirm(`Are you sure you want to delete online order #${order.order_no || order.id}? Inventory stock will be restored.`)) {
      return;
    }
    try {
      const res = await fetch(`${API}/ecommerce/orders/${order.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Order deleted successfully.');
        onClose();
        if (onOrderUpdated) onOrderUpdated();
      } else {
        alert(data.message || 'Failed to delete order');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // WhatsApp shortcut link
  const rawPhone = (order.customer_phone || '').replace(/[^0-9]/g, '');
  const bdPhone = rawPhone.startsWith('880') ? rawPhone : (rawPhone.startsWith('0') ? `88${rawPhone}` : `880${rawPhone}`);
  const whatsappUrl = `https://wa.me/${bdPhone}?text=Hello%20${encodeURIComponent(order.customer_name || 'Customer')},%20regarding%20your%20Sheba%20Technology%20online%20order%20%23${encodeURIComponent(order.order_no || order.id)}`;

  const items = order.items || [];
  const itemsSubtotal = items.reduce((sum, it) => sum + money(it.quantity) * money(it.unit_price), 0);
  const deliveryCharge = money(order.delivery_charge || 0);
  const grandTotal = money(order.total_amount || (itemsSubtotal + deliveryCharge));

  const currentStepIdx = STATUS_STEPS.findIndex((s) => s.key === currentStatus);

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛍️</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="m-0 text-lg font-extrabold">
                  Order #{order.order_no || order.order_number || order.id}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-extrabold uppercase ${
                    STATUS_BADGES[currentStatus] || STATUS_BADGES.pending
                  }`}
                >
                  {order.order_status || 'Pending'}
                </span>
              </div>
              <span className="text-xs text-slate-400">
                Placed on {order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenPrint && onOpenPrint(order)}
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              🖨️ Print Slip
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-white/10 hover:bg-white/20 text-white w-8 h-8 rounded-md cursor-pointer text-base flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto px-6 py-5 flex-1 bg-slate-50">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg text-xs mb-3.5 border border-red-200">
              ⚠️ {error}
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-lg text-xs mb-3.5 border border-emerald-200">
              ✓ {successMsg}
            </div>
          )}

          {/* Stepper Timeline */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 mb-4 shadow-xs">
            <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wide mb-3">
              Fulfillment Timeline &amp; Status Stepper
            </div>

            {isCancelled ? (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center">
                <div className="flex items-center gap-2 text-red-600 font-bold text-xs">
                  <span>🚫</span> This order has been cancelled and its inventory stock restored.
                </div>
                <button
                  type="button"
                  onClick={() => handleStatusChange('pending')}
                  disabled={updatingStatus}
                  className="px-3 py-1.5 bg-white border border-red-500 hover:bg-red-50 text-red-600 rounded-md text-xs font-bold cursor-pointer transition-colors"
                >
                  Reopen Order
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between relative">
                {STATUS_STEPS.map((step, idx) => {
                  const isDone = currentStepIdx >= idx;
                  const isCurrent = currentStepIdx === idx;
                  return (
                    <div
                      key={step.key}
                      className="flex-1 flex flex-col items-center relative z-10"
                    >
                      <button
                        type="button"
                        onClick={() => handleStatusChange(step.key)}
                        disabled={updatingStatus}
                        title={`Change to ${step.label}`}
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm cursor-pointer transition-all ${
                          isDone ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'
                        } ${isCurrent ? 'ring-4 ring-teal-200 border-2 border-teal-300 shadow-sm' : ''}`}
                      >
                        {step.icon}
                      </button>
                      <span
                        className={`text-xs mt-1.5 ${
                          isCurrent
                            ? 'font-extrabold text-slate-900'
                            : isDone
                            ? 'font-bold text-slate-700'
                            : 'font-medium text-slate-400'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {!isCancelled && (
              <div className="flex justify-end mt-3">
                <button
                  type="button"
                  onClick={() => handleStatusChange('cancelled')}
                  disabled={updatingStatus}
                  className="text-red-500 hover:text-red-600 text-xs font-semibold cursor-pointer underline transition-colors"
                >
                  Cancel Order &amp; Restock Products
                </button>
              </div>
            )}
          </div>

          {/* Two-Column Customer & Courier Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Customer Details Box */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="text-xs font-extrabold text-teal-600 uppercase tracking-wide mb-2">
                👤 Customer &amp; Recipient
              </div>
              <div className="text-base font-bold text-slate-900">{order.customer_name}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-slate-700">📞 {order.customer_phone}</span>
                <a
                  href={`tel:${order.customer_phone}`}
                  className="text-xs px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-sky-600 font-semibold no-underline transition-colors"
                >
                  Call
                </a>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 rounded text-emerald-700 font-bold no-underline transition-colors"
                >
                  WhatsApp
                </a>
              </div>
              <div className="mt-2 text-xs text-slate-500 leading-relaxed">
                <strong>Address:</strong> {order.shipping_address}
              </div>
              {order.customer_notes && (
                <div className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded-md">
                  <strong>Note:</strong> {order.customer_notes}
                </div>
              )}
            </div>

            {/* Courier & Payment Editor Box */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="text-xs font-extrabold text-teal-600 uppercase tracking-wide mb-2">
                🚚 Logistics &amp; Payment Status
              </div>
              <form onSubmit={handleSaveCourierAndPayment}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      COURIER PARTNER
                    </label>
                    <select
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs bg-white outline-none focus:border-teal-500"
                    >
                      <option value="">-- Choose Courier --</option>
                      {COURIER_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      PAYMENT STATUS
                    </label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs bg-white outline-none focus:border-teal-500"
                    >
                      <option value="unpaid">Unpaid / COD</option>
                      <option value="paid">Paid</option>
                      <option value="partial">Partially Paid</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                </div>

                <div className="mb-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    TRACKING / CONSIGNMENT ID
                  </label>
                  <input
                    type="text"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    placeholder="e.g. STDF-124982 or Pathao CN"
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs bg-white outline-none focus:border-teal-500 box-border"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingDetails}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold cursor-pointer transition-colors disabled:opacity-60"
                >
                  {savingDetails ? 'Saving...' : 'Save Logistics Info'}
                </button>
              </form>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-4 shadow-xs">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wide">
                Ordered Products ({items.length})
              </span>
            </div>

            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase">
                  <th className="px-3 py-2 text-left">PRODUCT</th>
                  <th className="px-3 py-2 text-center w-20">QTY</th>
                  <th className="px-3 py-2 text-right w-28">UNIT PRICE</th>
                  <th className="px-3 py-2 text-right w-28">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => {
                  const lineTotal = money(it.quantity) * money(it.unit_price);
                  return (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="px-3 py-2.5">
                        <div className="font-semibold text-slate-900">
                          {it.product_name || `Product ID #${it.product_id}`}
                        </div>
                        {it.sku && <div className="text-[11px] text-slate-500 mt-0.5">SKU: {it.sku}</div>}
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold">{it.quantity}</td>
                      <td className="px-3 py-2.5 text-right text-slate-700">{taka(it.unit_price)}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-slate-900">{taka(lineTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom Financials Summary Box */}
          <div className="flex flex-wrap justify-between items-center gap-3">
            <button
              type="button"
              onClick={handleDeleteOrder}
              className="text-red-500 hover:text-red-600 text-xs font-semibold cursor-pointer transition-colors"
            >
              🗑️ Delete Order
            </button>

            <div className="w-full sm:w-[280px] bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900">{taka(itemsSubtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>Delivery Charge:</span>
                <span className="font-semibold text-slate-900">{taka(deliveryCharge)}</span>
              </div>
              <div className="border-t border-slate-200 pt-1.5 flex justify-between text-sm font-extrabold text-slate-900">
                <span>Grand Total:</span>
                <span className="text-teal-600">{taka(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
