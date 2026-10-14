import React from 'react';
import { money, taka } from './newOrderConstants';

export default function EcommerceOrderItemsSection({
  items,
  products = [],
  onAddItem,
  onRemoveItem,
  onItemChange,
}) {
  return (
    <div
      style={{
        background: '#ffffff',
        padding: '16px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        marginBottom: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <div
          style={{
            fontSize: '0.8rem',
            fontWeight: 800,
            color: '#0d9488',
            textTransform: 'uppercase',
          }}
        >
          2. Order Products ({items.length})
        </div>
        <button
          type="button"
          onClick={onAddItem}
          style={{
            padding: '4px 10px',
            background: '#f0fdfa',
            border: '1px solid #99f6e4',
            color: '#0d9488',
            borderRadius: '6px',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          + Add Item
        </button>
      </div>

      {items.map((it, idx) => (
        <div
          key={idx}
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(200px, 2fr) 70px 100px 90px 30px',
            gap: '8px',
            alignItems: 'center',
            marginBottom: '8px',
            background: '#f8fafc',
            padding: '8px',
            borderRadius: '6px',
          }}
        >
          <div>
            <select
              value={it.product_id}
              onChange={(e) => onItemChange(idx, 'product_id', e.target.value)}
              required
              style={{
                width: '100%',
                padding: '7px 8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.84rem',
              }}
            >
              <option value="">-- Choose Product --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stock: {p.stock || 0}) - ৳{Number(p.selling_price || 0).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <input
              type="number"
              min="1"
              placeholder="Qty"
              value={it.quantity}
              onChange={(e) => onItemChange(idx, 'quantity', e.target.value)}
              style={{
                width: '100%',
                padding: '7px 6px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.84rem',
                textAlign: 'center',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <input
              type="number"
              placeholder="Price"
              value={it.unit_price}
              onChange={(e) => onItemChange(idx, 'unit_price', e.target.value)}
              style={{
                width: '100%',
                padding: '7px 6px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.84rem',
                textAlign: 'right',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div
            style={{
              textAlign: 'right',
              fontWeight: 700,
              fontSize: '0.88rem',
              color: '#0f172a',
            }}
          >
            {taka(money(it.quantity) * money(it.unit_price))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => onRemoveItem(idx)}
              disabled={items.length === 1}
              style={{
                background: 'none',
                border: 'none',
                color: items.length === 1 ? '#cbd5e1' : '#ef4444',
                cursor: items.length === 1 ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
              }}
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
