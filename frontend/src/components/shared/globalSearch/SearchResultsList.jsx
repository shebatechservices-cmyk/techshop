import React from 'react';
import SearchProductCard from './SearchProductCard';

const money = (val) => Number.parseFloat(val || 0) || 0;
const taka = (val) => `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function SearchResultsList({
  results,
  loading,
  totalResults,
  query,
  dropdownRef,
  onSelect,
  onQuickView,
}) {
  return (
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
            <SearchProductCard
              key={`prod-${item.id}`}
              item={item}
              onSelect={onSelect}
              onQuickView={onQuickView}
            />
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
                onSelect({
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
                onSelect({
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
                onSelect({
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
                onSelect({
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
                onSelect({
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
                onSelect({
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
  );
}
