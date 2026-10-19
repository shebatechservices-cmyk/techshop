import React from 'react';
import CardStockDimension from './product-card/CardStockDimension';
import CardSalesDimension from './product-card/CardSalesDimension';
import CardPurchasesDimension from './product-card/CardPurchasesDimension';
import CardWarrantyDimension from './product-card/CardWarrantyDimension';

export default function SearchProductCard({ item, onSelect, onQuickView }) {
  return (
    <div
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
          <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {item.sku ? `SKU: ${item.sku} ` : ''}{item.barcode ? `• Barcode: ${item.barcode}` : ''}
            {item.matched_serial && (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  background: item.matched_serial_status === 'Sold' ? '#f3e8ff' : '#ecfdf5',
                  color: item.matched_serial_status === 'Sold' ? '#7e22ce' : '#047857',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  border: `1px solid ${item.matched_serial_status === 'Sold' ? '#d8b4fe' : '#a7f3d0'}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>🎯 Matched S/N:</span>
                <span style={{ fontFamily: 'monospace' }}>{item.matched_serial}</span>
                <span>•</span>
                <span>{item.matched_serial_status === 'Sold' ? 'Sold' : 'In Stock'}</span>
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {onQuickView && (
            <button
              type="button"
              onClick={() => onQuickView(item)}
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                color: '#1e293b',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap',
              }}
              title="Open full 4-dimension modal popup"
            >
              <span>⚡</span> Quick View
            </button>
          )}
          <button
            type="button"
            onClick={() => onSelect({ section: 'inventory', search: item.name || item.sku })}
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
      </div>

      {/* 4 Operational Dimensions Sub-Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '8px', marginTop: '10px' }}>
        <CardStockDimension item={item} />
        <CardSalesDimension item={item} onSelect={onSelect} />
        <CardPurchasesDimension item={item} onSelect={onSelect} />
        <CardWarrantyDimension item={item} onSelect={onSelect} />
      </div>
    </div>
  );
}
