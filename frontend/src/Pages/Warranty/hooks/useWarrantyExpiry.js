import { useState, useEffect } from 'react';
import API from '../../../services/api';

export function useWarrantyExpiry({ showToast }) {
  const [expireData, setExpireData] = useState(null);
  const [expireLoading, setExpireLoading] = useState(true);
  const [showExpiredList, setShowExpiredList] = useState(false);

  // Load live warranty expiry tracker
  useEffect(() => {
    let active = true;
    fetch(`${API}/warranty/expiring?days=60`)
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (active && d && d.success) setExpireData(d);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setExpireLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Refresh expiry tracker on demand
  const refreshExpiry = async () => {
    setExpireLoading(true);
    try {
      const res = await fetch(`${API}/warranty/expiring?days=60`);
      const d = await res.json();
      if (d && d.success) {
        setExpireData(d);
        showToast(
          `Warranty tracker refreshed: ${d.summary?.expired_count || 0} expired, ${
            d.summary?.expiring_count || 0
          } expiring soon`
        );
      }
    } catch {
      showToast('Could not refresh warranty tracker', 'error');
    } finally {
      setExpireLoading(false);
    }
  };

  return {
    expireData,
    setExpireData,
    expireLoading,
    showExpiredList,
    setShowExpiredList,
    refreshExpiry,
  };
}
