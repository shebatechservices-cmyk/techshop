import { useState, useMemo, useEffect } from 'react';
import { getWarrantyValidity } from '../utils/inventoryUtils';

export default function useInventoryFilters({ products = [] }) {
  const [stockFilter, setStockFilter] = useState('all'); // 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Unique categories for filter dropdown
  const categoryList = useMemo(() => {
    const cats = new Set();
    products.forEach((p) => {
      if (p.category_name) cats.add(p.category_name);
    });
    return Array.from(cats).sort();
  }, [products]);

  // Active supplier warranty count
  const activeWarrantyCount = useMemo(() => {
    return products.filter((p) => {
      const v = getWarrantyValidity(p.supplier_warranty_expire_date);
      return v && !v.expired;
    }).length;
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    let result = products;

    // Filter by Stock Status
    if (stockFilter === 'in_stock') {
      result = result.filter((p) => Number(p.stock) > 0);
    } else if (stockFilter === 'low_stock') {
      result = result.filter((p) => p.stock_status === 'low_stock');
    } else if (stockFilter === 'out_of_stock') {
      result = result.filter((p) => p.stock_status === 'out_of_stock');
    }

    // Filter by Category
    if (categoryFilter !== 'ALL') {
      result = result.filter((p) => p.category_name === categoryFilter);
    }

    // Search query matching Composite Name, SKU, Barcode, Brand, Model, Category
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((p) => {
        return (
          (p.composite_name && p.composite_name.toLowerCase().includes(q)) ||
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.barcode && p.barcode.toLowerCase().includes(q)) ||
          (p.brand_name && p.brand_name.toLowerCase().includes(q)) ||
          (p.model_name && p.model_name.toLowerCase().includes(q)) ||
          (p.series_name && p.series_name.toLowerCase().includes(q)) ||
          (p.category_name && p.category_name.toLowerCase().includes(q)) ||
          (p.sub_category_name && p.sub_category_name.toLowerCase().includes(q))
        );
      });
    }

    return result;
  }, [products, stockFilter, categoryFilter, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const paginatedProducts = useMemo(() => {
    const start = (currentPageSafe - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPageSafe, itemsPerPage]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [stockFilter, categoryFilter, searchQuery]);

  return {
    stockFilter,
    setStockFilter,
    categoryFilter,
    setCategoryFilter,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    categoryList,
    activeWarrantyCount,
    filteredProducts,
    totalPages,
    currentPageSafe,
    paginatedProducts,
  };
}
