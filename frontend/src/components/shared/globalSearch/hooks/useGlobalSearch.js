import { useState, useEffect, useRef, useCallback } from 'react';
import API_BASE from '../../../../services/api';
import { resolveBarcodeModalPayload } from '../helpers/barcodeModalHelper';

const INITIAL_RESULTS = {
  sales: [],
  sale_quotations: [],
  customers: [],
  purchases: [],
  purchase_quotations: [],
  suppliers: [],
  products: [],
};

export default function useGlobalSearch(onNavigate) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [modalMatchType, setModalMatchType] = useState('');
  const [modalScannedCode, setModalScannedCode] = useState('');
  const [results, setResults] = useState(INITIAL_RESULTS);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceTimer = useRef(null);

  // Global Ctrl + K or / keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Perform search with debounce
  const handleQueryChange = (text) => {
    setQuery(text);
    if (!text.trim()) {
      setResults(INITIAL_RESULTS);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    setIsOpen(true);
    setLoading(true);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/search/global?q=${encodeURIComponent(text.trim())}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setResults(json.data);
          }
        }
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);
  };

  const totalResults =
    (results.sales?.length || 0) +
    (results.sale_quotations?.length || 0) +
    (results.customers?.length || 0) +
    (results.purchases?.length || 0) +
    (results.purchase_quotations?.length || 0) +
    (results.suppliers?.length || 0) +
    (results.products?.length || 0);

  const handleSelect = useCallback((destination) => {
    setIsOpen(false);
    if (onNavigate) {
      onNavigate(destination);
    }
  }, [onNavigate]);

  const handleOpenBarcodeModal = useCallback(async (codeToLookup, fallbackProduct = null) => {
    setLoading(true);
    try {
      const payload = await resolveBarcodeModalPayload(
        codeToLookup,
        fallbackProduct,
        query,
        results.products
      );
      if (payload) {
        setModalData(payload.modalData);
        setModalMatchType(payload.modalMatchType);
        setModalScannedCode(payload.modalScannedCode);
        setModalOpen(true);
        setIsOpen(false);
      }
    } catch (err) {
      console.error('Barcode lookup error:', err);
    } finally {
      setLoading(false);
    }
  }, [query, results.products]);

  const handleClear = useCallback(() => {
    setQuery('');
    setIsOpen(false);
    setResults(INITIAL_RESULTS);
    inputRef.current?.focus();
  }, []);

  return {
    query,
    isOpen,
    setIsOpen,
    loading,
    results,
    totalResults,
    modalOpen,
    setModalOpen,
    modalData,
    modalMatchType,
    modalScannedCode,
    inputRef,
    dropdownRef,
    handleQueryChange,
    handleSelect,
    handleClear,
    handleOpenBarcodeModal,
  };
}
