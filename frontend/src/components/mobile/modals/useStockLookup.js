import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../../services/api';

export default function useStockLookup({ isOpen }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Load products when opened
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await api.get('/products');
        const list = Array.isArray(res.data) ? res.data : (res.data?.products || []);
        if (isMounted) setProducts(list);
      } catch {
        // ignore load error
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [isOpen]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products.slice(0, 30);
    return products.filter((p) => {
      const name = String(p.name || '').toLowerCase();
      const sku = String(p.sku || '').toLowerCase();
      const barcode = String(p.barcode || '').toLowerCase();
      const cat = String(p.category_name || '').toLowerCase();
      return name.includes(q) || sku.includes(q) || barcode.includes(q) || cat.includes(q);
    }).slice(0, 40);
  }, [products, search]);

  const handleScanCode = useCallback((code) => {
    setSearch(code);
    setIsScannerOpen(false);
  }, []);

  return {
    products,
    filteredProducts,
    loading,
    search,
    setSearch,
    isScannerOpen,
    setIsScannerOpen,
    handleScanCode,
  };
}
