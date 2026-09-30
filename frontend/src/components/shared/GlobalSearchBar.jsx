import React, { useState, useEffect, useRef } from 'react';
import API_BASE from '../../services/api';
import SearchResultsList from './globalSearch/SearchResultsList';

export default function GlobalSearchBar({ onNavigate, compact = false, className = '' }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
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
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={compact ? "Search invoices, customers, suppliers..." : "Global Search: Invoices, Quotations, Customers, Suppliers, Products, SKU..."}
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
        />
      )}
    </div>
  );
}
