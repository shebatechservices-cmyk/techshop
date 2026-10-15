import { useState, useMemo, useRef, useEffect } from 'react';
import {
  fullCatalogName,
  isProductSerialTracked,
  isProductWarrantyRequired,
} from '../../../../../utils/productUtils';

/**
 * Hook to manage replacement items, product searches, and serial/barcode attachments.
 */
export default function useExchangeReplacementState({ products = [], onError }) {
  const [newItems, setNewItems] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeError, setBarcodeError] = useState({});

  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target)
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter products for replacement search
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return (products || []).filter((p) => {
      const full = fullCatalogName(p).toLowerCase();
      const name = (p.name || '').toLowerCase();
      const brand = (p.brand_name || '').toLowerCase();
      const sku = (p.sku || '').toLowerCase();
      const barcode = (p.barcode || '').toLowerCase();
      return (
        full.includes(q) ||
        name.includes(q) ||
        brand.includes(q) ||
        sku.includes(q) ||
        barcode.includes(q)
      );
    });
  }, [searchQuery, products]);

  const addNewProduct = (prod, initialSerial = '') => {
    const isTracked = isProductSerialTracked(prod);
    const isWarrantyReq = isProductWarrantyRequired(prod);
    const fullName = fullCatalogName(prod);
    if (Number(prod.stock || 0) <= 0) {
      if (onError) onError(`"${fullName}" has no stock available.`);
      return;
    }

    const startSerials = initialSerial ? [initialSerial] : [];
    const catalogWarranty =
      prod.warranty_months !== undefined && prod.warranty_months !== null
        ? Number(prod.warranty_months)
        : isWarrantyReq
        ? ''
        : 0;

    const exchangePrice = Number(
      prod.sale_price !== undefined &&
        prod.sale_price !== null &&
        Number(prod.sale_price) > 0
        ? prod.sale_price
        : prod.salePrice !== undefined &&
          prod.salePrice !== null &&
          Number(prod.salePrice) > 0
        ? prod.salePrice
        : prod.selling_price !== undefined &&
          prod.selling_price !== null &&
          Number(prod.selling_price) > 0
        ? prod.selling_price
        : prod.final_sale_price !== undefined &&
          prod.final_sale_price !== null &&
          Number(prod.final_sale_price) > 0
        ? prod.final_sale_price
        : prod.mrp !== undefined &&
          prod.mrp !== null &&
          Number(prod.mrp) > 0
        ? prod.mrp
        : prod.cost_price || prod.costPrice || prod.purchase_price || 0
    );
    const exchangeCost = Number(
      prod.cost_price !== undefined && prod.cost_price !== null
        ? prod.cost_price
        : prod.costPrice !== undefined && prod.costPrice !== null
        ? prod.costPrice
        : prod.purchase_price || prod.last_purchase_price || 0
    );
    const line = {
      localId: `${Date.now()}-${prod.id}`,
      product_id: prod.id,
      name: fullName,
      full_name: fullName,
      brand_name: prod.brand_name || '',
      stock: Number(prod.stock || 0),
      quantity: isTracked ? startSerials.length : 1,
      unit_price: exchangePrice,
      cost_price: exchangeCost,
      warranty_months: catalogWarranty,
      serials: startSerials,
      is_serial_tracked: isTracked,
      is_warranty_required: isWarrantyReq,
    };
    setNewItems((prev) => [...prev, line]);
    if (isTracked && startSerials.length === 0) {
      setExpandedId(line.localId);
    }
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const updateNewItem = (localId, patch) => {
    setNewItems((prev) =>
      prev.map((it) => (it.localId === localId ? { ...it, ...patch } : it))
    );
  };

  const removeNewItem = (localId) => {
    setNewItems((prev) => prev.filter((it) => it.localId !== localId));
  };

  const handleAddBarcode = (localId) => {
    const raw = barcodeInput.trim();
    if (!raw) return;
    const targetItem = newItems.find((it) => it.localId === localId);
    if (!targetItem) return;

    const existing = targetItem.serials || [];
    if (existing.map((s) => s.toLowerCase()).includes(raw.toLowerCase())) {
      setBarcodeError((prev) => ({
        ...prev,
        [localId]: 'Barcode already scanned',
      }));
      return;
    }

    const newSerials = [...existing, raw];
    const newQty = targetItem.is_serial_tracked
      ? newSerials.length
      : Math.max(Number(targetItem.quantity || 1), newSerials.length);
    updateNewItem(localId, { serials: newSerials, quantity: newQty });
    setBarcodeInput('');
    setBarcodeError((prev) => ({ ...prev, [localId]: '' }));
  };

  const handleRemoveBarcode = (localId, code) => {
    const targetItem = newItems.find((it) => it.localId === localId);
    if (!targetItem) return;
    const newSerials = (targetItem.serials || []).filter((s) => s !== code);
    const newQty = targetItem.is_serial_tracked
      ? newSerials.length
      : Math.max(
          1,
          (targetItem.serials || []).length > 1
            ? Number(targetItem.quantity || 1)
            : 1
        );
    updateNewItem(localId, { serials: newSerials, quantity: newQty });
  };

  return {
    newItems,
    setNewItems,
    expandedId,
    setExpandedId,
    searchQuery,
    setSearchQuery,
    isSearchOpen,
    setIsSearchOpen,
    barcodeInput,
    setBarcodeInput,
    barcodeError,
    searchContainerRef,
    searchInputRef,
    filteredProducts,
    addNewProduct,
    updateNewItem,
    removeNewItem,
    handleAddBarcode,
    handleRemoveBarcode,
  };
}
