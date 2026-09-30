import React, { useState, useEffect, useRef } from 'react';
import API_BASE from '../../services/api';
import SearchResultsList from './globalSearch/SearchResultsList';
import SerialBarcodeQuickViewModal from './globalSearch/SerialBarcodeQuickViewModal';

export default function GlobalSearchBar({ onNavigate, compact = false, className = '' }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [modalMatchType, setModalMatchType] = useState('');
  const [modalScannedCode, setModalScannedCode] = useState('');
  const [results, setResults] = useState({
    sales: [],
    sale_quotations: [],
    customers: [],
    purchases: [],
    purchase_quotations: [],
    suppliers: [],
    products: [],
  });

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
      setResults({
        sales: [],
        sale_quotations: [],
        customers: [],
        purchases: [],
        purchase_quotations: [],
        suppliers: [],
        products: [],
      });
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

  const handleSelect = (destination) => {
    setIsOpen(false);
    if (onNavigate) {
      onNavigate(destination);
    }
  };

  const handleOpenBarcodeModal = async (codeToLookup, fallbackProduct = null) => {
    const code = (codeToLookup || query || '').trim();
    if (!code && !fallbackProduct) return;

    setLoading(true);
    try {
      if (code) {
        const res = await fetch(`${API_BASE}/search/barcode-lookup?code=${encodeURIComponent(code)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setModalData(json.data);
            setModalMatchType(json.match_type || 'SERIAL');
            setModalScannedCode(json.scanned_code || code);
            setModalOpen(true);
            setIsOpen(false);
            setLoading(false);
            return;
          }
        }
      }

      // Fallback: If barcode-lookup didn't find specific unit, but we have a product item
      const targetProd = fallbackProduct || (results.products && results.products.length === 1 ? results.products[0] : null);
      if (targetProd) {
        const firstPo = targetProd.purchase_history?.[0] || null;
        const firstSale = targetProd.sales_history?.[0] || null;
        const isUnitSold = targetProd.matched_serial_status === 'Sold' || Boolean(firstSale);
        const unitStatus = targetProd.matched_serial 
          ? (isUnitSold ? 'Sold' : 'In Stock')
          : (Number(targetProd.stock) > 0 ? 'In Stock' : 'Out of Stock');

        setModalData({
          serial_code: targetProd.matched_serial || null,
          status: unitStatus,
          product: {
            id: targetProd.id,
            name: targetProd.name,
            brand_name: targetProd.brand_name,
            category_name: targetProd.category_name,
            sku: targetProd.sku,
            barcode: targetProd.barcode,
            stock: targetProd.stock,
            cost_price: targetProd.cost_price,
            sale_price: targetProd.sale_price,
          },
          purchase: firstPo ? {
            po_id: firstPo.po_id,
            po_number: firstPo.po_number,
            purchase_date: firstPo.purchase_date,
            cost_price: firstPo.cost_price,
            supplier_name: firstPo.supplier_name,
            supplier_phone: firstPo.supplier_phone,
            supplier_warranty_expire_date: firstPo.supplier_warranty_expire_date,
          } : null,
          inventory: {
            stock: targetProd.stock,
            unit_status: targetProd.matched_serial
              ? (isUnitSold ? 'Sold to Customer' : 'Available in Inventory')
              : (Number(targetProd.stock) > 0 ? 'In Stock' : 'Out of Stock'),
            cost_price: targetProd.cost_price,
            sale_price: targetProd.sale_price,
          },
          sale: firstSale ? {
            sale_id: firstSale.sale_id,
            invoice_no: firstSale.invoice_no,
            sale_date: firstSale.sale_date,
            customer_name: firstSale.customer_name,
            customer_phone: firstSale.customer_phone,
            unit_price: firstSale.unit_price,
            payment_status: 'paid',
          } : null,
          warranty: {
            warranty_months: targetProd.warranty_months,
            customer_warranty_info: `${targetProd.warranty_months || 12} Months Policy`,
            claims: targetProd.warranty_claims || [],
            returns: targetProd.returns_refunds || [],
          },
        });
        setModalMatchType(
          targetProd.matched_serial
            ? (isUnitSold ? 'SERIAL_SOLD' : 'SERIAL_INVENTORY')
            : (targetProd.barcode ? 'PRODUCT_BARCODE' : 'PRODUCT_DETAILS')
        );
        setModalScannedCode(code || targetProd.matched_serial || targetProd.barcode || targetProd.sku);
        setModalOpen(true);
        setIsOpen(false);
      }
    } catch (err) {
      console.error('Barcode lookup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    setResults({
      sales: [],
      sale_quotations: [],
      customers: [],
      purchases: [],
      purchase_quotations: [],
      suppliers: [],
      products: [],
    });
    inputRef.current?.focus();
  };

  return (
    <div className={`relative w-full z-[900] ${className}`}>
      {/* Search Input Bar */}
      <div
        className={`w-full flex items-center bg-gray-100 border border-transparent rounded-lg transition-all duration-150 focus-within:bg-white focus-within:border-transparent focus-within:ring-2 focus-within:ring-green-500 focus-within:shadow-sm ${compact ? 'px-3 py-1.5' : 'px-4 py-2'}`}
      >
        <svg className={`text-gray-500 mr-2.5 flex-shrink-0 ${compact ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleOpenBarcodeModal(query.trim());
            }
          }}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={compact ? "Scan barcode/serial or search..." : "Global Search: Scan Barcode/Serial (S/N), Invoices, Products, Customers..."}
          className={`flex-1 min-w-0 border-none outline-none bg-transparent font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-0 ${compact ? 'text-xs' : 'text-sm'}`}
        />

        {/* Loading Spinner */}
        {loading && (
          <span className="text-xs font-semibold text-green-600 mr-2 animate-pulse flex-shrink-0">
            Searching...
          </span>
        )}

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors mr-1 flex-shrink-0"
            title="Clear search"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Shortcut Badge */}
        <span
          className={`bg-gray-200/80 text-gray-500 font-semibold rounded tracking-wide select-none whitespace-nowrap flex-shrink-0 ${
            compact ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'
          }`}
          title="Press Ctrl+K to search anytime"
        >
          {compact ? 'Ctrl+K' : 'Ctrl + K'}
        </span>
      </div>

      {/* Floating Dropdown Results Menu */}
      {isOpen && query.trim().length > 0 && (
        <SearchResultsList
          results={results}
          loading={loading}
          totalResults={totalResults}
          query={query}
          dropdownRef={dropdownRef}
          onSelect={handleSelect}
          onQuickView={(prod) => {
            handleOpenBarcodeModal(prod.matched_serial || prod.barcode || prod.sku, prod);
          }}
        />
      )}

      {/* Instant 4-Dimension Serial / Barcode Quick-View Modal */}
      <SerialBarcodeQuickViewModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        data={modalData}
        matchType={modalMatchType}
        scannedCode={modalScannedCode}
        onNavigate={onNavigate}
      />
    </div>
  );
}
