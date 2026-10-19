import React from 'react';
import { taka } from './cardFormatters';

export default function CardStockDimension({ item }) {
  const isPositiveStock = Number(item.stock) > 0;

  return (
    <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
        <span>📦</span> 1. INVENTORY & STOCK
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
        <span>Stock: <strong style={{ color: isPositiveStock ? '#15803d' : '#ef4444' }}>{item.stock} pcs</strong></span>
        <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', background: isPositiveStock ? '#dcfce7' : '#fee2e2', color: isPositiveStock ? '#15803d' : '#991b1b' }}>
          {isPositiveStock ? 'In Stock' : 'Out of Stock'}
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
  );
}
