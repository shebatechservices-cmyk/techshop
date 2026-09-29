import { useState, useEffect } from 'react';
import API_BASE from '../../../../services/api';
import { PURCHASE_API } from '../../utils/purchaseCartUtils';

export function usePurchaseInitialData({
  initialProducts = [],
  supplierId = '',
  setError,
} = {}) {
  const [productList, setProductList] = useState(initialProducts);
  const [suppliers, setSuppliers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [summary, setSummary] = useState(null);

  // 1. Fetch Master Products catalog
  useEffect(() => {
    const fetchMasterProducts = async () => {
      try {
        const res = await fetch(`${API_BASE}/master/products`);
        if (res.ok) {
          const data = await res.json();
          setProductList(Array.isArray(data) ? data : data.data || []);
        }
      } catch (err) {
        console.error('Failed to load master products for purchase cart:', err);
      }
    };
    fetchMasterProducts();
  }, [initialProducts]);

  // 2. Fetch Suppliers and Accounts
  useEffect(() => {
    const load = async () => {
      const [supplierData, accountData] = await Promise.all([
        fetch(`${PURCHASE_API}/suppliers`)
          .then((res) => res.json())
          .catch(() => []),
        fetch(`${PURCHASE_API}/accounts`)
          .then((res) => res.json())
          .catch(() => []),
      ]);
      const supList = Array.isArray(supplierData) ? supplierData : [];
      setSuppliers(supList);
      setAccounts(Array.isArray(accountData) ? accountData : []);
    };
    load().catch(() => setError && setError('Failed to load purchase data'));
  }, [setError]);

  // 3. Fetch Supplier Financial Summary
  useEffect(() => {
    if (!supplierId) {
      setSummary(null);
      return;
    }
    fetch(`${PURCHASE_API}/suppliers/${supplierId}/summary`)
      .then((res) => res.json())
      .then(setSummary)
      .catch(() => setSummary(null));
  }, [supplierId]);

  return {
    productList,
    setProductList,
    suppliers,
    setSuppliers,
    accounts,
    setAccounts,
    summary,
    setSummary,
  };
}

export default usePurchaseInitialData;
