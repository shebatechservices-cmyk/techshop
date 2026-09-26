import { useState, useEffect, useMemo } from 'react';
import API from '../../../services/api';
import { isValidBDPhone } from '../../../utils/phoneUtils';

export const money = (val) => Number.parseFloat(val || 0) || 0;
export const taka = (val) =>
  `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const COURIER_PRESETS = [
  { label: 'Steadfast Courier (Inside Dhaka - ৳80)', name: 'Steadfast Courier', charge: 80 },
  { label: 'Steadfast Courier (Outside Dhaka - ৳150)', name: 'Steadfast Courier', charge: 150 },
  { label: 'Pathao Courier (Express - ৳120)', name: 'Pathao Courier', charge: 120 },
  { label: 'Sundarban Courier (Condition - ৳150)', name: 'Sundarban Courier', charge: 150 },
];

export default function useStorefrontManager({ products = [], onOrderPlaced } = {}) {
  const [activeView, setActiveView] = useState('store'); // 'store' | 'track' | 'account'
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Customer state (local simulation of customer session)
  const [customer, setCustomer] = useState(() => {
    try {
      const saved = localStorage.getItem('sheba_ecommerce_customer');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Auth Form
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authAddress, setAuthAddress] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authMsg, setAuthMsg] = useState('');

  // Checkout Form
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutAddress, setCheckoutAddress] = useState('');
  const [checkoutCourier, setCheckoutCourier] = useState('Steadfast Courier');
  const [checkoutDeliveryFee, setCheckoutDeliveryFee] = useState(80);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState('cod');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  // Tracking State
  const [trackQuery, setTrackQuery] = useState('');
  const [trackingOrders, setTrackingOrders] = useState([]);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');

  // Store Catalog filters
  const [storeSearch, setStoreSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Pre-fill checkout when customer exists
  useEffect(() => {
    if (customer) {
      setCheckoutName(customer.name || '');
      setCheckoutPhone(customer.phone || '');
      setCheckoutAddress(customer.address || '');
    }
  }, [customer]);

  // Cart operations
  const addToCart = (prod) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === prod.id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === prod.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          product_id: prod.id,
          name: prod.name,
          sku: prod.sku,
          price: Number(prod.selling_price || prod.purchase_price || 0),
          quantity: 1,
          stock: Number(prod.stock || 0),
        },
      ];
    });
    setIsCartOpen(true);
  };

  const updateCartQty = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product_id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const cartGrandTotal = cartSubtotal + Number(checkoutDeliveryFee || 0);

  // Customer Signup/Login
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!authName.trim() || !authPhone.trim()) {
      setAuthMsg('Please enter both name and phone number.');
      return;
    }
    if (!isValidBDPhone(authPhone)) {
      setAuthMsg('Please enter a valid 10-digit phone number after +880 (e.g. 17-XXXXXXXX).');
      return;
    }
    try {
      setAuthLoading(true);
      setAuthMsg('');
      const res = await fetch(`${API}/ecommerce/customer/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: authName.trim(),
          phone: authPhone.trim(),
          address: authAddress.trim(),
          email: authEmail.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const custData = data.data;
        setCustomer(custData);
        localStorage.setItem('sheba_ecommerce_customer', JSON.stringify(custData));
        setAuthMsg('✓ Signed in successfully! Welcome to Sheba Online Store.');
        setCheckoutName(custData.name);
        setCheckoutPhone(custData.phone);
        setCheckoutAddress(custData.address || '');
      } else {
        setAuthMsg(data.message || 'Failed to sign up.');
      }
    } catch (err) {
      setAuthMsg(err.message || 'Connection error.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Customer Logout
  const handleCustomerLogout = () => {
    setCustomer(null);
    localStorage.removeItem('sheba_ecommerce_customer');
    setCheckoutName('');
    setCheckoutPhone('');
    setCheckoutAddress('');
  };

  // Place Online Order
  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
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
        setCart([]);
        setIsCartOpen(false);
        if (onOrderPlaced) onOrderPlaced();

        // Automatically switch to parcel tracker for this order!
        setActiveView('track');
        setTrackQuery(createdOrder.order_no);
        handleTrackSearch(createdOrder.order_no);
      } else {
        setCheckoutError(data.message || 'Failed to complete order.');
      }
    } catch (err) {
      setCheckoutError(err.message || 'Connection error.');
    } finally {
      setPlacingOrder(false);
    }
  };

  // Parcel Tracking Search
  const handleTrackSearch = async (overrideQuery) => {
    const q = (overrideQuery || trackQuery).trim();
    if (!q) {
      setTrackingError('Please enter an Order Number (e.g. ECOM-123456) or Phone Number.');
      return;
    }
    try {
      setTrackingLoading(true);
      setTrackingError('');
      setTrackingOrders([]);
      const res = await fetch(`${API}/ecommerce/track/${encodeURIComponent(q)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setTrackingOrders(data.data || []);
      } else {
        setTrackingError(data.message || 'No orders found matching this query.');
      }
    } catch (err) {
      setTrackingError(err.message || 'Error tracking parcel.');
    } finally {
      setTrackingLoading(false);
    }
  };

  // Filtered store catalog
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (storeSearch.trim()) {
        const q = storeSearch.toLowerCase();
        const matchName = String(p.name || '').toLowerCase().includes(q);
        const matchSku = String(p.sku || '').toLowerCase().includes(q);
        if (!matchName && !matchSku) return false;
      }
      return true;
    });
  }, [products, storeSearch]);

  return {
    // Navigation & Views
    activeView,
    setActiveView,

    // Cart State
    cart,
    setCart,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    updateCartQty,
    cartSubtotal,
    cartGrandTotal,

    // Customer & Auth State
    customer,
    setCustomer,
    authName,
    setAuthName,
    authPhone,
    setAuthPhone,
    authAddress,
    setAuthAddress,
    authEmail,
    setAuthEmail,
    authLoading,
    setAuthLoading,
    authMsg,
    setAuthMsg,
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
    checkoutNotes,
    setCheckoutNotes,
    placingOrder,
    setPlacingOrder,
    checkoutError,
    setCheckoutError,
    handleCheckoutSubmit,

    // Tracking State
    trackQuery,
    setTrackQuery,
    trackingOrders,
    setTrackingOrders,
    trackingLoading,
    setTrackingLoading,
    trackingError,
    setTrackingError,
    handleTrackSearch,

    // Catalog & Search
    storeSearch,
    setStoreSearch,
    selectedCategory,
    setSelectedCategory,
    filteredProducts,

    // Utilities & Constants
    COURIER_PRESETS,
    money,
    taka,
  };
}
