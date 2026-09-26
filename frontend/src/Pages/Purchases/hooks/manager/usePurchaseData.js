import { useState, useEffect, useCallback } from 'react';
import API from '../../../../services/api';

export function usePurchaseData({ showToast }) {
  const [orders, setOrders] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [orderRes, quoteRes, suppRes, prodRes] = await Promise.all([
        fetch(`${API}/purchase`).catch(() => null),
        fetch(`${API}/purchase/quotations`).catch(() => null),
        fetch(`${API}/purchase/suppliers`).catch(() => null),
        fetch(`${API}/master/products`).catch(() => null),
      ]);

      if (orderRes && orderRes.ok) {
        const oData = await orderRes.json();
        setOrders(Array.isArray(oData) ? oData : (oData.data || []));
      }
      if (quoteRes && quoteRes.ok) {
        const qData = await quoteRes.json();
        setQuotations(Array.isArray(qData) ? qData : (qData.data || []));
      }
      if (suppRes && suppRes.ok) {
        const sData = await suppRes.json();
        setSuppliers(Array.isArray(sData) ? sData : (sData.data || []));
      }
      if (prodRes && prodRes.ok) {
        const pData = await prodRes.json();
        setProducts(Array.isArray(pData) ? pData : (pData.data || []));
      }
    } catch (err) {
      console.error('Failed to load purchase data:', err);
      if (showToast) showToast('Failed to load data from server', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAllData();
    const refresh = () => loadAllData();
    window.addEventListener('inventory_stock_changed', refresh);
    window.addEventListener('data_changed', refresh);
    window.addEventListener('account_balance_changed', refresh);
    window.addEventListener('cash_drawer_changed', refresh);
    window.addEventListener('wallet_balance_changed', refresh);
    return () => {
      window.removeEventListener('inventory_stock_changed', refresh);
      window.removeEventListener('data_changed', refresh);
      window.removeEventListener('account_balance_changed', refresh);
      window.removeEventListener('cash_drawer_changed', refresh);
      window.removeEventListener('wallet_balance_changed', refresh);
    };
  }, [loadAllData]);

  return {
    orders,
    setOrders,
    quotations,
    setQuotations,
    suppliers,
    setSuppliers,
    products,
    setProducts,
    loading,
    setLoading,
    loadAllData,
  };
}
