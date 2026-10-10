import { useState, useMemo } from 'react';
import { fullCatalogName } from '../../../../utils/productUtils';

export default function useStorefrontCatalog(products = []) {
  const [storeSearch, setStoreSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured'); // 'featured' | 'price-asc' | 'price-desc' | 'stock'

  // Extract unique categories from products
  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      const cat = p.category_name || p.category;
      if (cat && typeof cat === 'string') {
        set.add(cat.trim());
      }
    });
    return Array.from(set);
  }, [products]);

  // Filtered and sorted store catalog
  const filteredProducts = useMemo(() => {
    const list = products.filter((p) => {
      if (selectedCategory && selectedCategory !== 'all') {
        const cat = String(p.category_name || p.category || '').toLowerCase();
        if (!cat.includes(selectedCategory.toLowerCase())) return false;
      }
      if (storeSearch.trim()) {
        const q = storeSearch.toLowerCase();
        const catalogName = fullCatalogName(p).toLowerCase();
        const matchName = String(p.name || '').toLowerCase().includes(q) || catalogName.includes(q);
        const matchSku = String(p.sku || '').toLowerCase().includes(q);
        const matchBrand = String(p.brand_name || p.brand || '').toLowerCase().includes(q);
        const matchModel = String(p.model_name || p.model || '').toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchBrand && !matchModel) return false;
      }
      return true;
    });

    if (sortBy === 'price-asc') {
      list.sort((a, b) => Number(a.selling_price || a.purchase_price || 0) - Number(b.selling_price || b.purchase_price || 0));
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => Number(b.selling_price || b.purchase_price || 0) - Number(a.selling_price || a.purchase_price || 0));
    } else if (sortBy === 'stock') {
      list.sort((a, b) => Number(b.stock || 0) - Number(a.stock || 0));
    }

    return list;
  }, [products, storeSearch, selectedCategory, sortBy]);

  return {
    storeSearch,
    setStoreSearch,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    categories,
    filteredProducts,
  };
}
