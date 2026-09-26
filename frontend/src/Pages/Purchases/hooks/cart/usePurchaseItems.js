import { useState, useMemo } from 'react';
import {
  money,
  computeFinalSale,
  newLineItem,
  fullCatalogName,
} from '../../utils/purchaseCartUtils';

export function usePurchaseItems({
  productList = [],
  barcodeInputRef,
  searchInputRef,
  setBarcodeScanErrors,
  setError,
  setPopupMsg,
}) {
  const [items, setItems] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [query, setQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Search matches for autocomplete
  const matches = useMemo(() => {
    const list = Array.isArray(productList) ? productList : [];
    const term = query.trim().toLowerCase();
    if (!term) return list.slice(0, 30);
    return list
      .filter((product) => {
        const full = fullCatalogName(product).toLowerCase();
        const sku = (product.sku || '').toLowerCase();
        const barcode = (product.barcode || '').toLowerCase();
        const cat = (product.category_name || '').toLowerCase();
        const brand = (product.brand_name || '').toLowerCase();
        const name = (product.name || '').toLowerCase();
        return (
          full.includes(term) ||
          name.includes(term) ||
          sku.includes(term) ||
          barcode.includes(term) ||
          cat.includes(term) ||
          brand.includes(term)
        );
      })
      .slice(0, 30);
  }, [productList, query]);

  const updateItem = (localId, patch) => {
    setItems((current) =>
      current.map((item) => {
        if (item.localId !== localId) return item;
        const next = { ...item, ...patch };
        if (!next.final_sale_manual) next.final_sale_price = computeFinalSale(next);
        return next;
      })
    );
  };

  const handleItemCostChange = (item, newCostStr) => {
    const cost = money(newCostStr);
    let patch = { cost_price: newCostStr };
    if (
      cost > 0 &&
      item.margin_value !== '' &&
      item.margin_value !== null &&
      item.margin_value !== undefined
    ) {
      const margin = money(item.margin_value);
      const sale =
        item.margin_type === 'amount' ? cost + margin : cost + (cost * margin) / 100;
      patch.sale_price = Number(sale.toFixed(2));
      patch.final_sale_price = Number(sale.toFixed(2));
      patch.final_sale_manual = false;
    } else if (cost > 0 && money(item.sale_price) > 0) {
      const sale = money(item.sale_price);
      const margin =
        item.margin_type === 'amount' ? sale - cost : ((sale - cost) / cost) * 100;
      patch.margin_value = Number(margin.toFixed(2));
      patch.final_sale_price = sale;
    }
    updateItem(item.localId, patch);
  };

  const handleItemMarginChange = (item, newMarginStr) => {
    const margin = money(newMarginStr);
    const cost = money(item.cost_price);
    let patch = { margin_value: newMarginStr };
    if (cost > 0) {
      const sale =
        item.margin_type === 'amount' ? cost + margin : cost + (cost * margin) / 100;
      patch.sale_price = Number(sale.toFixed(2));
      patch.final_sale_price = Number(sale.toFixed(2));
      patch.final_sale_manual = false;
    }
    updateItem(item.localId, patch);
  };

  const handleItemSaleChange = (item, newSaleStr) => {
    const sale = money(newSaleStr);
    const cost = money(item.cost_price);
    let patch = {
      sale_price: newSaleStr,
      final_sale_price: newSaleStr,
      final_sale_manual: true,
    };
    if (cost > 0 && sale > 0) {
      const margin =
        item.margin_type === 'amount' ? sale - cost : ((sale - cost) / cost) * 100;
      patch.margin_value = Number(margin.toFixed(2));
    }
    updateItem(item.localId, patch);
  };

  const addProduct = (product) => {
    const existingIndex = items.findIndex((i) => i.product_id === product.id);
    if (existingIndex !== -1) {
      if (setPopupMsg) {
        setPopupMsg(
          `"${product.name || 'Product'}" is already in your purchase list. Adjust quantity or barcode in the table below.`
        );
      }
      setExpandedId(items[existingIndex].localId);
      setQuery('');
      setIsSearchOpen(false);
      return;
    }

    const item = newLineItem(product);
    setItems((current) => [item, ...current]);
    setExpandedId(item.localId);
    setQuery('');
    setIsSearchOpen(false);
    if (setError) setError('');
    if (setPopupMsg) setPopupMsg('');

    setTimeout(() => {
      if (item.is_serial_tracked && barcodeInputRef?.current) {
        barcodeInputRef.current.focus();
      } else if (searchInputRef?.current) {
        searchInputRef.current.focus();
      }
    }, 150);
  };

  const handleRemoveItem = (localId) => {
    setItems((current) => current.filter((item) => item.localId !== localId));
    if (setBarcodeScanErrors) {
      setBarcodeScanErrors((prev) => {
        const next = { ...prev };
        delete next[localId];
        return next;
      });
    }
  };

  const handleAddButtonClick = (product, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    addProduct(product);
  };

  return {
    items,
    setItems,
    expandedId,
    setExpandedId,
    query,
    setQuery,
    isSearchOpen,
    setIsSearchOpen,
    matches,
    updateItem,
    handleItemCostChange,
    handleItemMarginChange,
    handleItemSaleChange,
    addProduct,
    handleRemoveItem,
    handleAddButtonClick,
  };
}
