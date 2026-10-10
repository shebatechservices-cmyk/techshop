import { useState } from 'react';
import API from '../../../../services/api';

export default function useStorefrontTracking() {
  const [trackQuery, setTrackQuery] = useState('');
  const [trackingOrders, setTrackingOrders] = useState([]);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');

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

  return {
    trackQuery,
    setTrackQuery,
    trackingOrders,
    setTrackingOrders,
    trackingLoading,
    setTrackingLoading,
    trackingError,
    setTrackingError,
    handleTrackSearch,
  };
}
