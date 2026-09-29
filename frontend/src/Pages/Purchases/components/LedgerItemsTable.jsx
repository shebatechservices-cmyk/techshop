import React from 'react';

const defaultTaka = (val) =>
  `৳${(Number(val) || 0).toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function LedgerItemsTable({ items = [], taka = defaultTaka }) {
  return (
    <div>
      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
        Purchased Items ({items.length})
      </div>
      <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '10px 12px', width: '36px' }}>#</th>
              <th style={{ padding: '10px 12px' }}>Product Description</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', width: '60px' }}>Qty</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Cost Price</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Sale Price</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>Margin</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => {
              const qty = Number(it.quantity || 1);
              const cost = Number(it.cost_price || 0);
              const sale = Number(it.final_sale_price || it.sale_price || 0);
              const lineTotal = Number(it.line_total || cost * qty);
              const margin = it.margin_value ? `${it.margin_value}%` : '—';
              const desc = it.full_name || it.name || it.product_name || 'Product';

              return (
                <tr key={it.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{idx + 1}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{desc}</div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                      {it.category_name && (
                        <span style={{ fontSize: '0.72rem', background: '#e2e8f0', color: '#334155', padding: '1px 6px', borderRadius: '4px' }}>
                          {it.category_name}
                        </span>
                      )}
                      {it.sku && (
                        <span style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#64748b', padding: '1px 6px', borderRadius: '4px' }}>
                          SKU: {it.sku}
                        </span>
                      )}
                    </div>
                    {it.serials && it.serials.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                        {it.serials.map((s) => (
                          <span key={s} style={{ fontSize: '0.7rem', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '1px 5px', borderRadius: '3px' }}>
                            SN: {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>{qty}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#334155' }}>{taka(cost)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#64748b' }}>{taka(sale)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#10b981', fontWeight: 600 }}>{margin}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{taka(lineTotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
