import React, { useState, useEffect, useRef } from 'react';

import API_BASE from '../../services/api';

const money = (val) => Number.parseFloat(val || 0) || 0;
const taka = (val) => `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
        <div
          ref={dropdownRef}
          className="absolute top-[calc(100%+6px)] left-0 right-0 w-full bg-white rounded-xl border border-slate-200 shadow-2xl max-h-[480px] overflow-y-auto z-[99999] p-2"
        >
          {/* Header Count */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 12px',
              borderBottom: '1px solid #f1f5f9',
              marginBottom: '6px',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Search Results
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#0284c7',
                background: '#e0f2fe',
                padding: '2px 8px',
                borderRadius: '999px',
              }}
            >
              {totalResults} matches found
            </span>
          </div>

          {/* 0 Matches Empty State */}
          {!loading && totalResults === 0 && (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
              <p style={{ fontSize: '1.05rem', fontWeight: 600, color: '#334155', margin: '0 0 6px 0' }}>
                No records found matching "{query}"
              </p>
              <p style={{ fontSize: '0.84rem', color: '#94a3b8', margin: 0 }}>
                Try searching with an invoice number, customer/supplier name, phone, or product keyword.
              </p>
            </div>
          )}

          {/* OPERATIONAL PRODUCTS (1. Inventory & Stock, 2. Sales Invoice, 3. Purchase Invoice, 4. Warranty & Returns) */}
          {results.products?.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#0284c7',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '4px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>📦</span> Operational Products ({results.products.length})
              </div>
              {results.products.map((item) => (
                <div
                  key={`prod-${item.id}`}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    marginBottom: '8px',
                    background: '#ffffff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  {/* Header Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                          {item.name}
                        </span>
                        {item.brand_name && (
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#f1f5f9', color: '#475569', padding: '1px 6px', borderRadius: '4px' }}>
                            {item.brand_name}
                          </span>
                        )}
                        {item.category_name && (
                          <span style={{ fontSize: '0.7rem', fontWeight: 600, background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: '4px' }}>
                            {item.category_name}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                        {item.sku ? `SKU: ${item.sku} ` : ''}{item.barcode ? `• Barcode: ${item.barcode}` : ''}
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => handleSelect({ section: 'inventory', search: item.name || item.sku })}
                      style={{
                        background: '#f0f9ff',
                        border: '1px solid #bae6fd',
                        color: '#0284c7',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      View in Inventory →
                    </button>
                  </div>

                  {/* 4 Operational Dimensions Sub-Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '8px', marginTop: '10px' }}>
                    
                    {/* Dimension 1: Inventory and Stock */}
                    <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                        <span>📦</span> 1. INVENTORY & STOCK
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                        <span>Stock: <strong style={{ color: Number(item.stock) > 0 ? '#15803d' : '#ef4444' }}>{item.stock} pcs</strong></span>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', background: Number(item.stock) > 0 ? '#dcfce7' : '#fee2e2', color: Number(item.stock) > 0 ? '#15803d' : '#991b1b' }}>
                          {Number(item.stock) > 0 ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                        Sale: <strong>{taka(item.sale_price)}</strong> | Cost: {taka(item.cost_price)}
                      </div>
                      {item.supplier_warranty_expire_date ? (
                        <div style={{ fontSize: '0.7rem', color: '#0369a1', fontWeight: 700, marginTop: '4px', background: '#e0f2fe', padding: '2px 5px', borderRadius: '4px' }}>
                          🛡️ Supplier Exp (+60d): {new Date(item.supplier_warranty_expire_date).toLocaleDateString()}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '4px' }}>
                          Supplier Warranty: Not assigned
                        </div>
                      )}
                    </div>

                    {/* Dimension 2: Sales Invoice (if sold) */}
                    <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                        <span>🛒</span> 2. SALES INVOICES {item.sales_history?.length > 0 ? `(${item.sales_history.length})` : ''}
                      </div>
                      {item.sales_history && item.sales_history.length > 0 ? (
                        item.sales_history.slice(0, 2).map((sh, idx) => (
                          <div key={`sh-${idx}`} style={{ fontSize: '0.73rem', color: '#334155', borderBottom: idx === 0 && item.sales_history.length > 1 ? '1px dashed #cbd5e1' : 'none', paddingBottom: '2px', marginBottom: '2px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <strong style={{ color: '#15803d' }}>#{sh.invoice_no}</strong>
                              <span style={{ color: '#64748b', fontSize: '0.68rem' }}>{sh.sale_date ? new Date(sh.sale_date).toLocaleDateString() : ''}</span>
                            </div>
                            <div style={{ color: '#64748b', fontSize: '0.71rem' }}>
                              {sh.customer_name} • {sh.quantity} pcs @ {taka(sh.unit_price)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: '0.71rem', color: '#94a3b8', fontStyle: 'italic', padding: '4px 0' }}>
                          No sales recorded yet
                        </div>
                      )}
                    </div>

                    {/* Dimension 3: Purchase Invoice */}
                    <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                        <span>🚚</span> 3. PURCHASE INVOICES {item.purchase_history?.length > 0 ? `(${item.purchase_history.length})` : ''}
                      </div>
                      {item.purchase_history && item.purchase_history.length > 0 ? (
                        item.purchase_history.slice(0, 2).map((ph, idx) => (
                          <div key={`ph-${idx}`} style={{ fontSize: '0.73rem', color: '#334155', borderBottom: idx === 0 && item.purchase_history.length > 1 ? '1px dashed #cbd5e1' : 'none', paddingBottom: '2px', marginBottom: '2px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <strong style={{ color: '#0e7490' }}>#{ph.po_number}</strong>
                              <span style={{ color: '#64748b', fontSize: '0.68rem' }}>{ph.purchase_date ? new Date(ph.purchase_date).toLocaleDateString() : ''}</span>
                            </div>
                            <div style={{ color: '#64748b', fontSize: '0.71rem' }}>
                              {ph.supplier_name} • {ph.quantity} pcs @ {taka(ph.cost_price)}
                            </div>
                            {ph.supplier_warranty_expire_date && (
                              <div style={{ color: '#0369a1', fontSize: '0.68rem', fontWeight: 600 }}>
                                Sup Exp: {new Date(ph.supplier_warranty_expire_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: '0.71rem', color: '#94a3b8', fontStyle: 'italic', padding: '4px 0' }}>
                          No purchase records found
                        </div>
                      )}
                    </div>

                    {/* Dimension 4: Warranty, Return-Refund */}
                    <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                        <span>🛡️</span> 4. WARRANTY & RETURNS
                      </div>
                      {((item.warranty_claims && item.warranty_claims.length > 0) || (item.returns_refunds && item.returns_refunds.length > 0)) ? (
                        <div>
                          {item.warranty_claims?.slice(0, 1).map((wc, idx) => (
                            <div key={`wc-${idx}`} style={{ fontSize: '0.71rem', color: '#b45309', marginBottom: '2px' }}>
                              <strong>Claim #{wc.claim_no}</strong> ({wc.status}): {wc.issue_description || 'In process'}
                            </div>
                          ))}
                          {item.returns_refunds?.slice(0, 1).map((rr, idx) => (
                            <div key={`rr-${idx}`} style={{ fontSize: '0.71rem', color: '#dc2626' }}>
                              <strong>Return #{rr.return_no}</strong>: {rr.return_qty} pcs ({taka(rr.refund_amount)})
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.71rem', color: '#94a3b8', fontStyle: 'italic', padding: '4px 0' }}>
                          No active warranty claims or returns
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 1. SALES INVOICES */}
          {results.sales?.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#16a34a',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '4px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>🛒</span> Sale Invoices ({results.sales.length})
              </div>
              {results.sales.map((item) => (
                <div
                  key={`sale-${item.id}`}
                  onClick={() =>
                    handleSelect({
                      section: 'sales',
                      tab: 'history',
                      search: item.invoice_no || String(item.id),
                    })
                  }
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f0fdf4')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, color: '#15803d', fontSize: '0.9rem' }}>
                        {item.invoice_no || `INV-${item.id}`}
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: item.payment_status === 'paid' ? '#dcfce7' : '#fef3c7',
                          color: item.payment_status === 'paid' ? '#15803d' : '#b45309',
                        }}
                      >
                        {item.payment_status || 'invoice'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                      Customer: <strong>{item.customer_name}</strong> {item.customer_phone ? `(${item.customer_phone})` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                      {taka(item.total_amount)}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#0284c7', fontWeight: 600 }}>
                      Go to Sales History →
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2. SALE QUOTATIONS */}
          {results.sale_quotations?.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#4f46e5',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '4px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>📄</span> Sale Quotations ({results.sale_quotations.length})
              </div>
              {results.sale_quotations.map((item) => (
                <div
                  key={`quote-${item.id}`}
                  onClick={() =>
                    handleSelect({
                      section: 'sales',
                      tab: 'quotations',
                      search: item.quotation_no || String(item.id),
                    })
                  }
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f3ff')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, color: '#4f46e5', fontSize: '0.9rem' }}>
                        {item.quotation_no || `QTN-${item.id}`}
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: '#ede9fe',
                          color: '#4f46e5',
                        }}
                      >
                        {item.status || 'quotation'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                      Client: <strong>{item.customer_name || 'Client'}</strong> {item.customer_phone ? `(${item.customer_phone})` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                      {taka(item.total_amount)}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#4f46e5', fontWeight: 600 }}>
                      Go to Quotation History →
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 3. CUSTOMERS */}
          {results.customers?.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#0284c7',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '4px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>👤</span> Customers ({results.customers.length})
              </div>
              {results.customers.map((item) => (
                <div
                  key={`cust-${item.id}`}
                  onClick={() =>
                    handleSelect({
                      section: 'sales',
                      tab: 'customers',
                      search: item.name || item.phone,
                    })
                  }
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f9ff')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, color: '#0369a1', fontSize: '0.9rem' }}>
                        {item.name}
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: '#e0f2fe',
                          color: '#0284c7',
                        }}
                      >
                        {item.customer_type || 'Retail'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                      📞 {item.phone || 'No phone'} {item.address ? `• 📍 ${item.address}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: money(item.receivable_balance) > 0 ? '#ef4444' : '#10b981', fontSize: '0.85rem' }}>
                      {money(item.receivable_balance) > 0 ? 'Due:' : 'Advance:'} {taka(item.receivable_balance)}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#0284c7', fontWeight: 600 }}>
                      Go to Customer List →
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 4. PURCHASE ORDERS */}
          {results.purchases?.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#0891b2',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '4px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>📑</span> Purchase Orders ({results.purchases.length})
              </div>
              {results.purchases.map((item) => (
                <div
                  key={`po-${item.id}`}
                  onClick={() =>
                    handleSelect({
                      section: 'purchases',
                      tab: 'history',
                      search: item.po_number || String(item.id),
                    })
                  }
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#ecfeff')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, color: '#0e7490', fontSize: '0.9rem' }}>
                        {item.po_number || `PO-${item.id}`}
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: '#cffafe',
                          color: '#0891b2',
                        }}
                      >
                        {item.status || 'PO'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                      Supplier: <strong>{item.supplier_name}</strong> {item.supplier_phone ? `(${item.supplier_phone})` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                      {taka(item.total_cost)}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#0891b2', fontWeight: 600 }}>
                      Go to Purchase History →
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 5. PURCHASE QUOTATIONS */}
          {results.purchase_quotations?.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#9333ea',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '4px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>📋</span> Purchase Quotations ({results.purchase_quotations.length})
              </div>
              {results.purchase_quotations.map((item) => (
                <div
                  key={`pq-${item.id}`}
                  onClick={() =>
                    handleSelect({
                      section: 'purchases',
                      tab: 'quotations',
                      search: item.quotation_no || item.reference || String(item.id),
                    })
                  }
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#faf5ff')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, color: '#7e22ce', fontSize: '0.9rem' }}>
                        {item.quotation_no || `RFQ-${item.id}`}
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: '#f3e8ff',
                          color: '#9333ea',
                        }}
                      >
                        {item.status || 'quote'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                      Supplier: <strong>{item.supplier_name || 'Vendor'}</strong>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                      {taka(item.total_amount)}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#9333ea', fontWeight: 600 }}>
                      Go to Purchase Quotations →
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 6. SUPPLIERS */}
          {results.suppliers?.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#059669',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '4px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>🏢</span> Suppliers ({results.suppliers.length})
              </div>
              {results.suppliers.map((item) => (
                <div
                  key={`sup-${item.id}`}
                  onClick={() =>
                    handleSelect({
                      section: 'purchases',
                      tab: 'suppliers',
                      search: item.name || item.phone,
                    })
                  }
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#ecfdf5')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, color: '#047857', fontSize: '0.9rem' }}>
                        {item.name}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                      📞 {item.phone || item.mobile || 'No phone'} {item.contact_person ? `• Contact: ${item.contact_person}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: money(item.payable_balance) > 0 ? '#ef4444' : '#10b981', fontSize: '0.85rem' }}>
                      {money(item.payable_balance) > 0 ? 'Due:' : 'Advance Given:'} {taka(item.payable_balance)}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 600 }}>
                      Go to Supplier List →
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
