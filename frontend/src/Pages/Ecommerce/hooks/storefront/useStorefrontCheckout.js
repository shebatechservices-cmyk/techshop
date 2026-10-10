import { useState, useEffect } from 'react';
import API from '../../../../services/api';
import { isValidBDPhone } from '../../../../utils/phoneUtils';

export default function useStorefrontCheckout({
  cart = [],
  customer = null,
  setCart,
  setIsCartOpen,
  onOrderPlaced,
  setActiveView,
  setTrackQuery,
  handleTrackSearch,
} = {}) {
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutAddress, setCheckoutAddress] = useState('');
  const [checkoutCourier, setCheckoutCourier] = useState('Steadfast Courier');
  const [checkoutDeliveryFee, setCheckoutDeliveryFee] = useState(80);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState('cod');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  // Pre-fill checkout when customer exists
  useEffect(() => {
    if (customer) {
      setCheckoutName(customer.name || '');
      setCheckoutPhone(customer.phone || '');
      setCheckoutAddress(customer.address || '');
    }
  }, [customer]);

  const handleCheckoutSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (cart.length === 0) {
      setCheckoutError('Your shopping cart is empty.');
      return;
    }
    if (!checkoutName.trim() || !checkoutPhone.trim() || !checkoutAddress.trim()) {
      setCheckoutError('Please provide delivery recipient name, phone number, and address.');
      return;
    }
    if (!isValidBDPhone(checkoutPhone)) {
      setCheckoutError('Please enter a valid 10-digit delivery phone number after +880 (e.g. 17-XXXXXXXX).');
      return;
    }

    try {
      setPlacingOrder(true);
      setCheckoutError('');
      const payload = {
        customer_name: checkoutName.trim(),
        customer_phone: checkoutPhone.trim(),
        shipping_address: checkoutAddress.trim(),
        customer_notes: checkoutNotes.trim(),
        courier_name: checkoutCourier,
        delivery_charge: Number(checkoutDeliveryFee || 0),
        payment_method: checkoutPaymentMethod,
        payment_status: 'unpaid',
        items: cart.map((it) => ({
          product_id: it.product_id,
          quantity: it.quantity,
          unit_price: it.price,
        })),
      };

      const res = await fetch(`${API}/ecommerce/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const createdOrder = data.data;
        alert(`🎉 Order Placed Successfully! Your Order No is: ${createdOrder.order_no}`);
        if (setCart) setCart([]);
        if (setIsCartOpen) setIsCartOpen(false);
        if (onOrderPlaced) onOrderPlaced();

        // Switch to parcel tracker for this order
        if (setActiveView) setActiveView('track');
        if (setTrackQuery) setTrackQuery(createdOrder.order_no);
        if (handleTrackSearch) handleTrackSearch(createdOrder.order_no);
      } else {
        setCheckoutError(data.message || 'Failed to complete order.');
      }
    } catch (err) {
      setCheckoutError(err.message || 'Connection error.');
    } finally {
      setPlacingOrder(false);
    }
  };

  return {
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
    checkoutNotes,
    setCheckoutNotes,
    placingOrder,
    setPlacingOrder,
    checkoutError,
    setCheckoutError,
    handleCheckoutSubmit,
  };
}
