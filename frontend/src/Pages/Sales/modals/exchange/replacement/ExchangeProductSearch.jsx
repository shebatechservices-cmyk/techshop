import React from 'react';
import { fullCatalogName } from '../../../../../utils/productUtils';

const money = (val) => Number.parseFloat(val || 0) || 0;
const taka = (val) =>
  `৳${money(val).toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function ExchangeProductSearch({
  searchContainerRef,
  searchInputRef,
  searchQuery,
  setSearchQuery,
  isSearchOpen,
  setIsSearchOpen,
  filteredProducts = [],
  addNewProduct,
}) {
  return (
    <div
      ref={searchContainerRef}
      style={{ position: 'relative', marginBottom: '14px' }}
    >
      <input
        ref={searchInputRef}
        type="text"
        value={searchQuery}
        onFocus={() => setIsSearchOpen(true)}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setIsSearchOpen(true);
        }}
        placeholder="🔍 Search replacement products by name, brand, SKU or barcode..."
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1.5px solid #4338ca',
          fontSize: '0.88rem',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      {isSearchOpen && filteredProducts.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 50,
            marginTop: '4px',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            maxHeight: '220px',
            overflowY: 'auto',
          }}
        >
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              onClick={() => addNewProduct(p)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <strong>{fullCatalogName(p)}</strong>
                <span
                  style={{
                    fontSize: '0.74rem',
                    color: '#64748b',
                    marginLeft: '6px',
                  }}
                >
                  Stock: {p.stock || 0}
                </span>
              </div>
              <span style={{ fontWeight: 700, color: '#16a34a' }}>
                {taka(
                  p.sale_price ??
                    p.salePrice ??
                    p.selling_price ??
                    p.purchase_price ??
                    0
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
