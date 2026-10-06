import React, { useState } from 'react';
import API from '../../../services/api';
import OrderDetailsHeader from './order-details/OrderDetailsHeader';
import OrderFulfillmentStepper from './order-details/OrderFulfillmentStepper';
import OrderCustomerDetailsCard from './order-details/OrderCustomerDetailsCard';
import OrderLogisticsForm from './order-details/OrderLogisticsForm';
import OrderItemsTable from './order-details/OrderItemsTable';
import OrderFinancialSummary from './order-details/OrderFinancialSummary';

const money = (val) => Number.parseFloat(val || 0) || 0;

const STATUS_KEYS = ['pending', 'processing', 'shipped', 'delivered'];

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
  const currentStepIdx = STATUS_KEYS.indexOf(currentStatus);

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <OrderDetailsHeader
          order={order}
          currentStatus={currentStatus}
          onOpenPrint={onOpenPrint}
          onClose={onClose}
        />

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
          <OrderFulfillmentStepper
            currentStatus={currentStatus}
            currentStepIdx={currentStepIdx}
            isCancelled={isCancelled}
            updatingStatus={updatingStatus}
            onStatusChange={handleStatusChange}
          />

          {/* Two-Column Customer & Courier Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <OrderCustomerDetailsCard
              order={order}
              whatsappUrl={whatsappUrl}
            />

            <OrderLogisticsForm
              courierName={courierName}
              setCourierName={setCourierName}
              trackingCode={trackingCode}
              setTrackingCode={setTrackingCode}
              paymentStatus={paymentStatus}
              setPaymentStatus={setPaymentStatus}
              savingDetails={savingDetails}
              onSubmit={handleSaveCourierAndPayment}
            />
          </div>

          {/* Items Table */}
          <OrderItemsTable items={items} />

          {/* Bottom Financials Summary Box */}
          <OrderFinancialSummary
            itemsSubtotal={itemsSubtotal}
            deliveryCharge={deliveryCharge}
            grandTotal={grandTotal}
            onDeleteOrder={handleDeleteOrder}
          />
        </div>
      </div>
    </div>
  );
}
