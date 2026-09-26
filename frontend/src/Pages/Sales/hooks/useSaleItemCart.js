import { useState, useEffect, useMemo, useRef } from 'react';
import API from '../../../services/api';
import {
  fullCatalogName,
  isProductSerialTracked,
  isProductWarrantyRequired,
} from '../../../utils/productUtils';

export default function useSaleItemCart({ products = [], setError = () => {} }) {
  const [items, setItems] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [activeCostCardId, setActiveCostCardId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeError, setBarcodeError] = useState({});

  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const barcodeInputRef = useRef(null);

  const toggleCostCard = (localId) => {
    setActiveCostCardId((prev) => (prev === localId ? null : localId));
  };

  // Close cost popup when clicking anywhere outside
  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (activeCostCardId && !e.target.closest('.cost-peek-container')) {
        setActiveCostCardId(null);
      }
    };
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, [activeCostCardId]);

  // Autofocus barcode input when item expanded
  useEffect(() => {
    if (expandedId) {
      setBarcodeInput('');
      const timer = setTimeout(() => {
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [expandedId]);

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

  // Filter products for search dropdown
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return (products || []).filter((p) => {
      const full = fullCatalogName(p).toLowerCase();
      const name = (p.name || '').toLowerCase();
      const brand = (p.brand_name || '').toLowerCase();
      const sku = (p.sku || '').toLowerCase();
      const barcode = (p.barcode || '').toLowerCase();
      const subBarcode = (p.sub_unit_barcode || '').toLowerCase();
      return (
        full.includes(q) ||
        name.includes(q) ||
        brand.includes(q) ||
        sku.includes(q) ||
        barcode.includes(q) ||
        subBarcode.includes(q)
      );
    });
  }, [searchQuery, products]);

  const addProduct = (prod, initialSerial = '', forcedUnit = null) => {
    const isTracked = isProductSerialTracked(prod);
    const isWarrantyReq = isProductWarrantyRequired(prod);
    const fullName = fullCatalogName(prod);
    if (Number((prod && prod.stock) || 0) <= 0) {
      setError(`"${fullName}" has no stock available — cannot add to sale invoice.`);
      setSearchQuery('');
      setIsSearchOpen(false);
      return;
    }

    const isSubUnitScan =
      forcedUnit === 'sub_unit' ||
      (initialSerial &&
        prod.sub_unit_barcode &&
        prod.sub_unit_barcode.toLowerCase() === initialSerial.toLowerCase());

    const basePrice = Number(
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
        : prod.mrp !== undefined && prod.mrp !== null && Number(prod.mrp) > 0
        ? prod.mrp
        : prod.cost_price || prod.costPrice || prod.purchase_price || 0
    );

    const conversionRate = Number(prod.conversion_rate || 1);
    const subUnitPrice =
      prod.sub_unit_selling_price !== undefined &&
      prod.sub_unit_selling_price !== null &&
      Number(prod.sub_unit_selling_price) > 0
        ? Number(prod.sub_unit_selling_price)
        : conversionRate > 1
        ? Number((basePrice / conversionRate).toFixed(2))
        : basePrice;

    const currentUnitType = isSubUnitScan ? 'sub_unit' : 'base_unit';
    const activePrice = isSubUnitScan ? subUnitPrice : basePrice;
    const activeUnitName = isSubUnitScan
      ? prod.sub_unit_name || 'Meter'
      : prod.unit_name || 'Pcs';

    const existing = items.find(
      (it) => it.product_id === prod.id && it.unit_type === currentUnitType
    );
    if (existing) {
      const newSerials =
        initialSerial && !(existing.serials || []).includes(initialSerial)
          ? [...(existing.serials || []), initialSerial]
          : existing.serials || [];
      const newQty = isTracked
        ? newSerials.length
        : Math.max(existing.quantity + 1, newSerials.length);
      updateItem(existing.localId, {
        quantity: newQty,
        serials: newSerials,
        isSerialRequired: isTracked,
        is_serial_required: isTracked,
        is_serial_tracked: isTracked,
        tracks_serial: isTracked,
      });
      if (isTracked && newSerials.length === 0) {
        setExpandedId(existing.localId);
      }
      setSearchQuery('');
      setIsSearchOpen(false);
      return;
    }

    const unitCost = Number(
      prod.cost_price !== undefined && prod.cost_price !== null
        ? prod.cost_price
        : prod.costPrice !== undefined && prod.costPrice !== null
        ? prod.costPrice
        : prod.purchase_price || prod.last_purchase_price || 0
    );
    const startSerials = [];
    if (initialSerial && !isSubUnitScan) {
      startSerials.push(initialSerial);
    }

    const inheritedWarranty =
      prod.batch_warranty_months !== undefined &&
      prod.batch_warranty_months !== null &&
      Number(prod.batch_warranty_months) > 0
        ? Number(prod.batch_warranty_months)
        : prod.warranty_months !== undefined &&
          prod.warranty_months !== null &&
          Number(prod.warranty_months) > 0
        ? Number(prod.warranty_months)
        : isWarrantyReq
        ? ''
        : 0;

    const line = {
      localId: `${Date.now()}-${prod.id}-${currentUnitType}`,
      product_id: prod.id,
      name: fullName,
      full_name: fullName,
      brand_name: prod.brand_name || '',
      stock: Number(prod.stock || 0),
      quantity: isTracked ? startSerials.length : 1,
      unit_price: activePrice,
      cost_price:
        isSubUnitScan && conversionRate > 1
          ? Number((unitCost / conversionRate).toFixed(2))
          : unitCost,
      base_unit_price: basePrice,
      base_unit_cost: unitCost,
      unit_type: currentUnitType,
      unit_name: activeUnitName,
      base_unit_name: prod.unit_name || 'Pcs',
      sub_unit_name: prod.sub_unit_name || null,
      conversion_rate: conversionRate,
      sub_unit_selling_price: subUnitPrice,
      sub_unit_barcode: prod.sub_unit_barcode || null,
      is_bundle: Boolean(prod.is_bundle),
      bundle_items: Array.isArray(prod.bundle_items) ? prod.bundle_items : [],
      discount: 0,
      warranty_months: inheritedWarranty,
      serials: startSerials,
      isSerialRequired: isTracked,
      is_serial_required: isTracked,
      is_serial_tracked: isTracked,
      tracks_serial: isTracked,
      isWarrantyRequired: isWarrantyReq,
      is_warranty_required: isWarrantyReq,
    };
    setItems((prev) => [...prev, line]);
    if (isTracked && startSerials.length === 0) {
      setExpandedId(line.localId);
    }
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const switchItemUnit = (localId, targetUnitType) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.localId !== localId) return it;
        if (targetUnitType === 'sub_unit') {
          const subPrice =
            it.sub_unit_selling_price && Number(it.sub_unit_selling_price) > 0
              ? Number(it.sub_unit_selling_price)
              : it.conversion_rate > 1
              ? Number((Number(it.base_unit_price || it.unit_price) / it.conversion_rate).toFixed(2))
              : Number(it.base_unit_price || it.unit_price);
          return {
            ...it,
            unit_type: 'sub_unit',
            unit_name: it.sub_unit_name || 'Meter',
            unit_price: subPrice,
          };
        } else {
          return {
            ...it,
            unit_type: 'base_unit',
            unit_name: it.base_unit_name || 'Pcs',
            unit_price: Number(it.base_unit_price || it.unit_price),
          };
        }
      })
    );
  };

  const updateItem = (localId, patch) => {
    setItems((prev) =>
      prev.map((it) => (it.localId === localId ? { ...it, ...patch } : it))
    );
  };

  const removeItem = (localId) => {
    setItems((prev) => prev.filter((it) => it.localId !== localId));
  };

  const handleScanEnter = async (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    const lowerQ = q.toLowerCase();

    // 1. Check for exact sub-unit barcode match
    const exactSubUnit = (products || []).find(
      (p) =>
        Number(p.stock || 0) > 0 &&
        p.sub_unit_barcode &&
        p.sub_unit_barcode.toLowerCase() === lowerQ
    );
    if (exactSubUnit) {
      addProduct(exactSubUnit, q, 'sub_unit');
      setSearchError('');
      return;
    }

    // 2. Check for exact primary barcode or SKU match
    const exact = (products || []).find(
      (p) =>
        Number(p.stock || 0) > 0 &&
        ((p.barcode && p.barcode.toLowerCase() === lowerQ) ||
          (p.sku && p.sku.toLowerCase() === lowerQ))
    );
    if (exact) {
      addProduct(exact, q, 'base_unit');
      setSearchError('');
      return;
    }

    if (filteredProducts.length > 0) {
      addProduct(filteredProducts[0]);
      setSearchError('');
      return;
    }

    try {
      const res = await fetch(`${API}/search/product?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json().catch(() => null);
        const found = data && data.data && data.data[0];
        if (found && Number(found.stock || 0) > 0) {
          const isSub =
            found.sub_unit_barcode &&
            found.sub_unit_barcode.toLowerCase() === lowerQ;
          addProduct(found, q, isSub ? 'sub_unit' : 'base_unit');
          setSearchError('');
          setSearchQuery('');
          setIsSearchOpen(false);
          return;
        }
      }
    } catch (err) {
      console.error('Barcode server lookup failed:', err);
    }

    setSearchError(
      `No product found for "${q}". Check the barcode/SKU or add this product to the catalog first.`
    );
  };

  const handleAddBarcode = (localId, explicitValue) => {
    const raw = (explicitValue !== undefined ? explicitValue : barcodeInput).trim();
    if (!raw) return;

    const candidates = raw
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (!candidates.length) return;

    const targetItem = items.find((it) => it.localId === localId);
    if (!targetItem) return;

    const existingMap = new Map();
    items.forEach((it) => {
      (it.serials || []).forEach((s) => existingMap.set(s.toLowerCase(), it.name));
    });

    const toAdd = [];
    const duplicates = [];

    candidates.forEach((code) => {
      const lower = code.toLowerCase();
      if (existingMap.has(lower) || toAdd.some((c) => c.toLowerCase() === lower)) {
        duplicates.push(code);
      } else {
        toAdd.push(code);
        existingMap.set(lower, targetItem.name);
      }
    });

    if (duplicates.length > 0) {
      setBarcodeError((prev) => ({
        ...prev,
        [localId]: `Duplicate barcode rejected: ${duplicates.join(', ')}`,
      }));
    } else {
      setBarcodeError((prev) => ({ ...prev, [localId]: '' }));
    }

    if (toAdd.length > 0) {
      const newSerials = [...(targetItem.serials || []), ...toAdd];
      const newQty = targetItem.is_serial_tracked
        ? newSerials.length
        : Math.max(Number(targetItem.quantity || 1), newSerials.length);
      updateItem(localId, {
        serials: newSerials,
        quantity: newQty,
      });
      setBarcodeInput('');
    }
  };

  const handleRemoveBarcode = (localId, code) => {
    const targetItem = items.find((it) => it.localId === localId);
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
    updateItem(localId, {
      serials: newSerials,
      quantity: newQty,
    });
  };

  return {
    items,
    setItems,
    expandedId,
    setExpandedId,
    activeCostCardId,
    setActiveCostCardId,
    searchQuery,
    setSearchQuery,
    isSearchOpen,
    setIsSearchOpen,
    searchError,
    setSearchError,
    barcodeInput,
    setBarcodeInput,
    barcodeError,
    setBarcodeError,

    searchContainerRef,
    searchInputRef,
    barcodeInputRef,

    filteredProducts,
    toggleCostCard,
    addProduct,
    switchItemUnit,
    updateItem,
    removeItem,
    handleScanEnter,
    handleAddBarcode,
    handleRemoveBarcode,
  };
}
