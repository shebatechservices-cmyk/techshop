import React from 'react';

export default function PurchasePrintItemsTable({
  items = [],
  isChalan = false,
  fullCatalogName,
  taka,
}) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.76rem',
        textAlign: 'left',
        pageBreakInside: 'auto',
        breakInside: 'auto',
      }}>
        <thead>
          <tr style={{ background: '#0f172a', color: '#ffffff' }}>
            <th style={{ padding: '4px 6px', width: '28px', textAlign: 'center' }}>#</th>
            <th style={{ padding: '4px 6px' }}>Product Description</th>
            <th style={{ padding: '4px 6px', width: '65px', textAlign: 'center' }}>Warranty</th>
            {!isChalan && <th style={{ padding: '4px 6px', width: '80px', textAlign: 'right' }}>Unit Cost</th>}
            <th style={{ padding: '4px 6px', width: '40px', textAlign: 'center' }}>Qty</th>
            {!isChalan && <th style={{ padding: '4px 6px', width: '90px', textAlign: 'right' }}>Total Cost</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const qty = Number(item.quantity || 0);
            const cost = Number(item.cost_price || 0);
            const total = Number(item.line_total || cost * qty);
            const serials = Array.isArray(item.serials) ? item.serials : [];
            return (
              <tr
                key={idx}
                style={{
                  borderBottom: '1px solid #e2e8f0',
                  background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid',
                }}
              >
                <td style={{ padding: '3.5px 6px', textAlign: 'center', fontWeight: 600, color: '#64748b' }}>
                  {idx + 1}
                </td>
                <td style={{ padding: '3.5px 6px' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.25, fontSize: '0.78rem' }}>
                    {(fullCatalogName && fullCatalogName(item)) || item.full_name || item.name || item.product_name || 'Product'}
                  </div>
                  {!item.full_name && item.brand_name && (
                    <div style={{ fontSize: '0.68rem', color: '#64748b', lineHeight: 1.2 }}>
                      Brand: {item.brand_name}
                    </div>
                  )}
                  {serials.length > 0 && (
                    <div style={{
                      fontSize: '0.66rem',
                      color: '#0369a1',
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      marginTop: '2px',
                      lineHeight: 1.25,
                      wordBreak: 'break-word',
                    }}>
                      <strong style={{ color: '#0284c7', fontFamily: 'inherit' }}>S/N:</strong> {serials.join(', ')}
                    </div>
                  )}
                </td>
                <td style={{ padding: '3.5px 6px', textAlign: 'center', color: '#475569' }}>
                  {item.warranty_months ? `${item.warranty_months} Mos` : '—'}
                </td>
                {!isChalan && (
                  <td style={{ padding: '3.5px 6px', textAlign: 'right', fontWeight: 600 }}>
                    {taka(cost)}
                  </td>
                )}
                <td style={{ padding: '3.5px 6px', textAlign: 'center', fontWeight: 700, color: '#0284c7' }}>
                  {qty}
                </td>
                {!isChalan && (
                  <td style={{ padding: '3.5px 6px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                    {taka(total)}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
