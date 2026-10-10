import { useState } from 'react';
import useStorefrontCart from './storefront/useStorefrontCart';
import useStorefrontAuth from './storefront/useStorefrontAuth';
import useStorefrontTracking from './storefront/useStorefrontTracking';
import useStorefrontCatalog from './storefront/useStorefrontCatalog';
import useStorefrontCheckout from './storefront/useStorefrontCheckout';

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

  // Modular Sub-Hooks
  const cartHook = useStorefrontCart();
  const authHook = useStorefrontAuth();
  const trackHook = useStorefrontTracking();
  const catalogHook = useStorefrontCatalog(products);

  const checkoutHook = useStorefrontCheckout({
    cart: cartHook.cart,
    customer: authHook.customer,
    setCart: cartHook.setCart,
    setIsCartOpen: cartHook.setIsCartOpen,
    onOrderPlaced,
    setActiveView,
    setTrackQuery: trackHook.setTrackQuery,
    handleTrackSearch: trackHook.handleTrackSearch,
  });

  const cartGrandTotal = cartHook.cartSubtotal + Number(checkoutHook.checkoutDeliveryFee || 0);

  // Sync logout with checkout form fields
  const handleCustomerLogout = () => {
    authHook.handleCustomerLogout();
    checkoutHook.setCheckoutName('');
    checkoutHook.setCheckoutPhone('');
    checkoutHook.setCheckoutAddress('');
  };

  return {
    // Navigation & Views
    activeView,
    setActiveView,

    // Cart State & Actions
    ...cartHook,
    cartGrandTotal,

    // Customer & Auth State
    ...authHook,
    handleCustomerLogout,

    // Checkout Form State & Actions
    ...checkoutHook,

    // Tracking State & Actions
    ...trackHook,

    // Catalog, Search & Sorting
    ...catalogHook,

    // Utilities & Presets
    COURIER_PRESETS,
    money,
    taka,
  };
}
