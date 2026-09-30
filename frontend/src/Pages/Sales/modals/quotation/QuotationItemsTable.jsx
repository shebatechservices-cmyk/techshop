import React from 'react';

const money = (val) => Number.parseFloat(val || 0) || 0;
const taka = (val) => `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function QuotationItemsTable({
  items,
  onUpdateItem,
  onRemoveItem,
}) {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '18px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
            <th style={{ padding: '10px 12px' }}>PRODUCT DESCRIPTION</th>
            <th style={{ padding: '10px 12px', width: '105px', textAlign: 'center' }}>WARRANTY</th>
            <th style={{ padding: '10px 12px', width: '80px', textAlign: 'center' }}>QTY</th>
            <th style={{ padding: '10px 12px', width: '110px', textAlign: 'right' }}>UNIT RATE ৳</th>
            <th style={{ padding: '10px 12px', width: '105px', textAlign: 'right' }}>U. DISC ৳</th>
            <th style={{ padding: '10px 12px', width: '120px', textAlign: 'right' }}>TOTAL ৳</th>
            <th style={{ padding: '10px 12px', width: '40px', textAlign: 'center' }}></th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                No items added yet. Search and click products above to add them to this quotation.
              </td>
            </tr>
          ) : (
            items.map((it) => (
              <tr key={it.localId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                {/* 1. PRODUCT DESCRIPTION */}
                <td style={{ padding: '8px 12px' }}>
                  <strong style={{ color: '#0f172a' }}>{it.product_name}</strong>
                </td>

                {/* 2. WARRANTY */}
                <td style={{ padding: '8px 12px' }}>
                  <input
                    type="number"
                    min="0"
                    value={it.warranty_months !== undefined ? it.warranty_months : ''}
                    onChange={(e) => onUpdateItem(it.localId, 'warranty_months', e.target.value)}
                    placeholder="0 Mos"
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      textAlign: 'center',
                      boxSizing: 'border-box',
                    }}
                  />
                </td>

                {/* 3. QTY */}
                <td style={{ padding: '8px 12px' }}>
                  <input
                    type="number"
                    min="1"
                    value={it.quantity !== undefined ? it.quantity : 1}
                    onChange={(e) => onUpdateItem(it.localId, 'quantity', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      textAlign: 'center',
                      boxSizing: 'border-box',
                    }}
                  />
                </td>

                {/* 4. UNIT RATE ৳ */}
                <td style={{ padding: '8px 12px' }}>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={it.unit_price !== undefined ? it.unit_price : ''}
                    onChange={(e) => onUpdateItem(it.localId, 'unit_price', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      textAlign: 'right',
                      boxSizing: 'border-box',
                    }}
                  />
                </td>

                {/* 5. U. DISC ৳ */}
                <td style={{ padding: '8px 12px' }}>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={it.unit_discount !== undefined ? it.unit_discount : ''}
                    onChange={(e) => onUpdateItem(it.localId, 'unit_discount', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      textAlign: 'right',
                      boxSizing: 'border-box',
                    }}
                  />
                </td>

                {/* 6. TOTAL ৳ */}
                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                  {taka(it.line_total)}
                </td>

                {/* Delete Button */}
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(it.localId)}
                    style={{
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: '6px',
                      width: '26px',
                      height: '26px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                    }}
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
