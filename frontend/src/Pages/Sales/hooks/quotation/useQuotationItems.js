import { useState, useEffect, useMemo, useRef } from 'react';
import { fullCatalogName } from '../../../../utils/productUtils';

export function useQuotationItems({ products = [] }) {
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef(null);

  // Close search popup if clicked outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return (products || []).filter((p) => {
      const name = (p.name || p.product_name || '').toLowerCase();
      const sku = (p.sku || '').toLowerCase();
      const brand = (p.brand_name || '').toLowerCase();
      return name.includes(q) || sku.includes(q) || brand.includes(q);
    }).slice(0, 10);
  }, [searchQuery, products]);

  const handleAddItem = (prod) => {
    const existing = items.find((it) => it.product_id === prod.id);
    const fullName = fullCatalogName(prod);
    if (existing) {
      setItems((prev) =>
        prev.map((it) => {
          if (it.product_id !== prod.id) return it;
          const newQty = it.quantity + 1;
          const price = Number(it.unit_price || 0);
          const uDisc = Number(it.unit_discount || 0);
          return {
            ...it,
            quantity: newQty,
            line_total: Math.max(0, newQty * (price - uDisc)),
          };
        })
      );
    } else {
      const price = Number(
        prod.sale_price !== undefined && prod.sale_price !== null && Number(prod.sale_price) > 0
          ? prod.sale_price
          : (prod.salePrice !== undefined && prod.salePrice !== null && Number(prod.salePrice) > 0
            ? prod.salePrice
            : (prod.selling_price !== undefined && prod.selling_price !== null && Number(prod.selling_price) > 0
              ? prod.selling_price
              : (prod.final_sale_price !== undefined && prod.final_sale_price !== null && Number(prod.final_sale_price) > 0
                ? prod.final_sale_price
                : (prod.mrp !== undefined && prod.mrp !== null && Number(prod.mrp) > 0
                  ? prod.mrp
                  : (prod.cost_price || prod.costPrice || prod.purchase_price || 0)))))
      );
      setItems((prev) => [
        ...prev,
        {
          localId: `${Date.now()}-${prod.id}`,
          product_id: prod.id,
          product_name: fullName,
          full_name: fullName,
          brand_name: prod.brand_name || '',
          quantity: 1,
          unit_price: price,
          unit_discount: 0,
          line_total: price,
          warranty_months: prod.warranty_months !== undefined && prod.warranty_months !== null ? Number(prod.warranty_months) : 0,
        },
      ]);
    }
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const handleUpdateItem = (localId, field, val) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.localId !== localId) return it;
        const updated = { ...it, [field]: val };
        const qty = Number(field === 'quantity' ? val : it.quantity) || 1;
        const price = Number(field === 'unit_price' ? val : it.unit_price) || 0;
        const uDisc = Number(field === 'unit_discount' ? val : (it.unit_discount || 0)) || 0;
        updated.line_total = Math.max(0, qty * (price - uDisc));
        return updated;
      })
    );
  };

  const handleRemoveItem = (localId) => {
    setItems((prev) => prev.filter((it) => it.localId !== localId));
  };

  return {
    items,
    setItems,
    searchQuery,
    setSearchQuery,
    isSearchOpen,
    setIsSearchOpen,
    searchContainerRef,
    filteredProducts,
    handleAddItem,
    handleUpdateItem,
    handleRemoveItem,
  };
}
