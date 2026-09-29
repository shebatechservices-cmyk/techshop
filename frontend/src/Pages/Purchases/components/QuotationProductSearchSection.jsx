import React from 'react';
import { productLabel } from '../../../utils/productUtils';

export default function QuotationProductSearchSection({
  searchQuery,
  setSearchQuery,
  filteredProducts = [],
  handleAddItem,
  onClose,
  onOpenAddProduct,
}) {
  return (
    <div style={{
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '10px',
      padding: '16px',
      marginBottom: '20px',
    }}>
      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
        Search & Add Products to Quotation
      </label>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by name, brand, SKU..."
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.9rem',
              outline: 'none',
              boxSizing: 'border-box',
              background: '#ffffff',
            }}
          />

          {filteredProducts.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
              zIndex: 20,
              maxHeight: '200px',
              overflowY: 'auto',
            }}>
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleAddItem(p)}
                  style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <strong style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.92rem' }}>
                        {productLabel(p)}
                      </strong>
                      {p.category_name && (
                        <span style={{ fontSize: '0.72rem', padding: '1px 6px', background: '#e2e8f0', color: '#334155', borderRadius: '4px', fontWeight: 600 }}>
                          {p.category_name}
                        </span>
                      )}
                      {p.brand_name && (
                        <span style={{ fontSize: '0.72rem', padding: '1px 6px', background: '#e0f2fe', color: '#0369a1', borderRadius: '4px', fontWeight: 600 }}>
                          {p.brand_name}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <span>Stock: <strong style={{ color: p.stock > 0 ? '#15803d' : '#dc2626' }}>{p.stock ?? 0}</strong></span>
                      {p.sku && <span>SKU: {p.sku}</span>}
                      {Number(p.purchase_price) > 0 && <span>Last Cost: ৳{Number(p.purchase_price).toLocaleString()}</span>}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    background: '#4f46e5',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    flexShrink: 0,
                  }}>
                    + Add Item
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            if (onClose) onClose();
            if (onOpenAddProduct) {
              onOpenAddProduct();
            } else {
              window.dispatchEvent(new CustomEvent('open-add-product'));
            }
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 16px',
            background: '#0f766e',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.86rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            boxShadow: '0 1px 3px rgba(15,118,110,0.2)',
          }}
          title="Navigate to Catalog & open Add Product popup"
        >
          + New Product
        </button>
      </div>
    </div>
  );
}
