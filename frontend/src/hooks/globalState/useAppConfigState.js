import { useState, useEffect } from 'react';
import API_BASE from '../../services/api';

export function useAppConfigState(currentUser) {
  const [shopInfo, setShopInfo] = useState({
    shop_name: 'Sheba Technology & Networking',
    branch_name: 'Head Office - Dhaka',
  });
  const [licenseState, setLicenseState] = useState(null);

  // 1. License Check
  const fetchLicenseCheck = async () => {
    try {
      const res = await fetch(`${API_BASE}/license/status`);
      if (res.ok) {
        const data = await res.json();
        setLicenseState(data);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchLicenseCheck();
    const licInterval = setInterval(fetchLicenseCheck, 10 * 60 * 1000); // sync every 10 min
    return () => clearInterval(licInterval);
  }, [currentUser]);

  // 2. Fetch Shop Info Settings
  const fetchShopSettings = () => {
    fetch(`${API_BASE}/settings`)
      .then((r) => (r.ok ? r.json() : { data: {} }))
      .then((json) => {
        if (json?.data) {
          setShopInfo((prev) => ({ ...prev, ...json.data }));
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchShopSettings();
    window.addEventListener('shop-info-updated', fetchShopSettings);
    return () => window.removeEventListener('shop-info-updated', fetchShopSettings);
  }, [currentUser]);

  return {
    shopInfo,
    setShopInfo,
    licenseState,
    fetchLicenseCheck,
  };
}
