import { useState, useEffect, useCallback } from 'react';
import API from '../../../../services/api';

export function useSalesData({ showToast }) {
  const [sales, setSales] = useState([]);
  const [quotationsCount, setQuotationsCount] = useState(0);
  const [customersCount, setCustomersCount] = useState(0);
  const [modalCustomers, setModalCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shopSettings, setShopSettings] = useState({
    allow_invoice_modification: true,
    invoice_edit_time_limit_hours: 360,
    security_pin: '1234',
  });

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [salesRes, quoteRes, prodRes, settingsRes] = await Promise.all([
        fetch(`${API}/sales`).catch(() => null),
        fetch(`${API}/sales/quotations`).catch(() => null),
        fetch(`${API}/master/products`).catch(() => null),
        fetch(`${API}/settings`).catch(() => null),
      ]);

      if (salesRes && salesRes.ok) {
        const json = await salesRes.json();
        setSales(Array.isArray(json) ? json : json.data || []);
      }

      if (quoteRes && quoteRes.ok) {
        const json = await quoteRes.json();
        const list = Array.isArray(json) ? json : json.data || [];
        setQuotationsCount(list.length);
      }

      // Sync customer count for SalesLayout header badges
      fetch(`${API}/sales/customers`)
        .then((r) => r.json())
        .then((d) => setCustomersCount(Array.isArray(d) ? d.length : d?.data?.length || 0))
        .catch(() => {});

      if (prodRes && prodRes.ok) {
        const json = await prodRes.json();
        setProducts(Array.isArray(json) ? json : json.data || []);
      }

      if (settingsRes && settingsRes.ok) {
        const json = await settingsRes.json();
        if (json?.data) {
          setShopSettings({
            allow_invoice_modification: json.data.allow_invoice_modification !== false,
            invoice_edit_time_limit_hours: json.data.invoice_edit_time_limit_hours ?? 360,
            security_pin: json.data.security_pin || '1234',
          });
        }
      }
    } catch (err) {
      console.error('Failed to load sales and customer data:', err);
      showToast?.('Error loading data from server', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Initial load and event listeners for real-time stock/data changes
  useEffect(() => {
    loadAllData();
    const refresh = () => loadAllData();
    window.addEventListener('inventory_stock_changed', refresh);
    window.addEventListener('data_changed', refresh);
    return () => {
      window.removeEventListener('inventory_stock_changed', refresh);
      window.removeEventListener('data_changed', refresh);
    };
  }, [loadAllData]);

  // Refresh product catalog and customer list when requested (e.g., when New Sale modal opens)
  const refreshModalData = useCallback(() => {
    fetch(`${API}/master/products`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const list = Array.isArray(json)
          ? json
          : json && Array.isArray(json.data)
          ? json.data
          : null;
        if (list) setProducts(list);
      })
      .catch(() => {});

    fetch(`${API}/sales/customers`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const list = Array.isArray(json)
          ? json
          : json && Array.isArray(json.data)
          ? json.data
          : null;
        if (list) setModalCustomers(list);
      })
      .catch(() => {});
  }, []);

  return {
    sales,
    setSales,
    quotationsCount,
    setQuotationsCount,
    customersCount,
    setCustomersCount,
    modalCustomers,
    setModalCustomers,
    products,
    setProducts,
    loading,
    setLoading,
    shopSettings,
    setShopSettings,
    loadAllData,
    refreshModalData,
  };
}
