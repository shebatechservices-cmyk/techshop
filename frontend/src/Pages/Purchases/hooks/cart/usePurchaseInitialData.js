import { useState, useEffect } from 'react';
import API_BASE from '../../../../services/api';
import { PURCHASE_API } from '../../utils/purchaseCartUtils';

export function usePurchaseInitialData({
  initialProducts = [],
  initialSuppliers = [],
  newlyCreatedSupplier = null,
  supplierId = '',
  setError,
} = {}) {
  const [productList, setProductList] = useState(initialProducts);
  const [suppliers, setSuppliers] = useState(Array.isArray(initialSuppliers) && initialSuppliers.length > 0 ? initialSuppliers : []);
  const [accounts, setAccounts] = useState([]);
  const [summary, setSummary] = useState(null);

  // Sync with external suppliers prop
  useEffect(() => {
    if (Array.isArray(initialSuppliers) && initialSuppliers.length > 0) {
      setSuppliers(initialSuppliers);
    }
  }, [initialSuppliers]);

  // Sync with newlyCreatedSupplier prop
  useEffect(() => {
    if (newlyCreatedSupplier && newlyCreatedSupplier.id) {
      setSuppliers((prev) => [newlyCreatedSupplier, ...prev.filter((s) => s.id !== newlyCreatedSupplier.id)]);
    }
  }, [newlyCreatedSupplier]);

  // Real-time synchronization when a supplier is created anywhere in the app
  useEffect(() => {
    const handleSupplierCreated = (e) => {
      const created = e.detail;
      if (created && created.id) {
        setSuppliers((prev) => [created, ...prev.filter((s) => s.id !== created.id)]);
      }
    };
    window.addEventListener('supplier_created', handleSupplierCreated);
    return () => window.removeEventListener('supplier_created', handleSupplierCreated);
  }, []);

  // 1. Fetch Master Products catalog on mount
  useEffect(() => {
    let isMounted = true;
    const fetchMasterProducts = async () => {
      try {
        const res = await fetch(`${API_BASE}/master/products`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setProductList(Array.isArray(data) ? data : data.data || []);
        }
      } catch (err) {
        console.error('Failed to load master products for purchase cart:', err);
      }
    };
    fetchMasterProducts();
    return () => {
      isMounted = false;
    };
  }, []);

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
      setSuppliers((prev) => {
        if (!supList.length) return prev;
        // Merge fetched suppliers with any newly added supplier
        const map = new Map();
        prev.forEach((s) => map.set(s.id, s));
        supList.forEach((s) => map.set(s.id, s));
        return Array.from(map.values());
      });
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
