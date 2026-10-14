import { useState, useEffect, useMemo, useRef } from 'react';
import { fullCatalogName } from '../../../utils/productUtils';
import {
  createCartItem,
  computeSwitchedUnitItem,
  applyItemPatch,
} from './cart/cartItemHelpers';
import {
  performScanLookup,
  addBarcodeCandidates,
  removeBarcodeFromItem,
} from './cart/useCartBarcodeOps';

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

  const updateItem = (localId, patch) => {
    setItems((prev) =>
      prev.map((it) => (it.localId === localId ? applyItemPatch(it, patch, setError) : it))
    );
  };

  const addProduct = (prod, initialSerial = '', forcedUnit = null) => {
    const result = createCartItem(prod, initialSerial, forcedUnit, items);
    if (result.error) {
      if (setError) setError(result.error);
      setSearchQuery('');
      setIsSearchOpen(false);
      return;
    }

    if (result.isExisting) {
      updateItem(result.existingId, result.patch);
      if (result.expandItem) {
        setExpandedId(result.existingId);
      }
    } else {
      setItems((prev) => [...prev, result.item]);
      if (result.expandItem) {
        setExpandedId(result.item.localId);
      }
    }

    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const switchItemUnit = (localId, targetUnitType) => {
    setItems((prev) =>
      prev.map((it) =>
        it.localId === localId ? computeSwitchedUnitItem(it, targetUnitType) : it
      )
    );
  };

  const removeItem = (localId) => {
    setItems((prev) => prev.filter((it) => it.localId !== localId));
  };

  const handleScanEnter = async (event) => {
    await performScanLookup({
      event,
      searchQuery,
      products,
      filteredProducts,
      addProduct,
      setSearchError,
      setSearchQuery,
      setIsSearchOpen,
    });
  };

  const handleAddBarcode = (localId, explicitValue) => {
    addBarcodeCandidates({
      localId,
      explicitValue,
      barcodeInput,
      items,
      updateItem,
      setBarcodeInput,
      setBarcodeError,
      setError,
    });
  };

  const handleRemoveBarcode = (localId, code) => {
    removeBarcodeFromItem({ localId, code, items, updateItem });
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
