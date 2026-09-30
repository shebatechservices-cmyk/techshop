import React from 'react';
import SearchProductCard from './SearchProductCard';
import SearchEmptyState from './sections/SearchEmptyState';
import SearchSalesSection from './sections/SearchSalesSection';
import SearchPurchasesSection from './sections/SearchPurchasesSection';
import SearchPartiesSection from './sections/SearchPartiesSection';

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
      {!loading && totalResults === 0 && <SearchEmptyState query={query} />}

      {/* OPERATIONAL PRODUCTS */}
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

      {/* SALES & SALE QUOTATIONS */}
      <SearchSalesSection
        sales={results.sales}
        quotations={results.sale_quotations}
        onSelect={onSelect}
      />

      {/* CUSTOMERS & SUPPLIERS */}
      <SearchPartiesSection
        customers={results.customers}
        suppliers={results.suppliers}
        onSelect={onSelect}
      />

      {/* PURCHASES & PURCHASE QUOTATIONS */}
      <SearchPurchasesSection
        purchases={results.purchases}
        quotations={results.purchase_quotations}
        onSelect={onSelect}
      />
    </div>
  );
}
