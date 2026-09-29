import React from 'react';

export default function QuotationItemsTable({
  items = [],
  handleUpdateItem,
  handleRemoveItem,
}) {
  return (
    <div style={{
      border: '1px solid #e2e8f0',
      borderRadius: '10px',
      overflow: 'hidden',
      marginBottom: '20px',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
            <th style={{ padding: '10px 14px' }}>Product</th>
            <th style={{ padding: '10px 14px', width: '110px' }}>Quantity</th>
            <th style={{ padding: '10px 14px', width: '140px' }}>Est. Unit Price</th>
            <th style={{ padding: '10px 14px', width: '140px' }}>Line Total</th>
            <th style={{ padding: '10px 14px' }}>Specification / Notes</th>
            <th style={{ padding: '10px 14px', width: '40px', textAlign: 'center' }}></th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                No items added yet. Search products above to add them to this quotation.
              </td>
            </tr>
          ) : (
            items.map((it) => {
              const lineTotal = (Number(it.quantity) || 0) * (Number(it.unit_price) || 0);
              return (
                <tr key={it.localId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1e293b' }}>
                    {it.name}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <input
                      type="number"
                      min="1"
                      value={it.quantity}
                      onChange={(e) => handleUpdateItem(it.localId, 'quantity', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        outline: 'none',
                        fontSize: '0.85rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={it.unit_price}
                      onChange={(e) => handleUpdateItem(it.localId, 'unit_price', e.target.value)}
                      placeholder="0.00"
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        outline: 'none',
                        fontSize: '0.85rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0f172a' }}>
                    ৳ {lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <input
                      type="text"
                      value={it.notes}
                      onChange={(e) => handleUpdateItem(it.localId, 'notes', e.target.value)}
                      placeholder="e.g. 1 Year warranty"
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        outline: 'none',
                        fontSize: '0.85rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(it.localId)}
                      style={{
                        background: '#fef2f2',
                        color: '#ef4444',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        width: '28px',
                        height: '28px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                      }}
                      title="Remove item"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
