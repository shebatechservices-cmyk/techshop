import React from 'react';
import { fullCatalogName } from '../../../../utils/productUtils';

const money = (val) => Number.parseFloat(val || 0) || 0;
const taka = (val) => `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function QuotationProductSearch({
  searchQuery,
  onSearchChange,
  isSearchOpen,
  onSearchFocus,
  filteredProducts,
  onAddItem,
  searchContainerRef,
}) {
  return (
    <div ref={searchContainerRef} style={{ position: 'relative', marginBottom: '18px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={searchQuery}
          onFocus={onSearchFocus}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="🔍 Search products by name, SKU, or barcode to add to quotation..."
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '9px',
            border: '1.5px solid #6366f1',
            fontSize: '0.9rem',
            outline: 'none',
            background: '#ffffff',
          }}
        />
      </div>

      {/* Floating Dropdown */}
      {isSearchOpen && filteredProducts.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 20,
            marginTop: '4px',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '10px',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.15)',
            maxHeight: '260px',
            overflowY: 'auto',
            padding: '6px',
          }}
        >
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              onClick={() => onAddItem(prod)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background 0.1s',
                fontSize: '0.86rem',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#eef2ff')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div>
                <strong style={{ color: '#0f172a' }}>{fullCatalogName(prod)}</strong>
                <span style={{ fontSize: '0.76rem', color: '#64748b', marginLeft: '8px' }}>
                  SKU: {prod.sku || 'N/A'} · Stock: {prod.stock || 0}
                </span>
              </div>
              <div style={{ fontWeight: 700, color: '#4f46e5' }}>
                {taka(prod.selling_price || prod.purchase_price || 0)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
