import React from 'react';

export default function PurchasePrintItemsTable({
  items = [],
  isChalan = false,
  fullCatalogName,
  taka,
}) {
  const totalQty = items.reduce((sum, it) => sum + Number(it.quantity || 0), 0);
  const totalAmount = items.reduce((sum, it) => sum + (Number(it.line_total || (Number(it.cost_price || 0) * Number(it.quantity || 0)))), 0);

  return (
    <div style={{ marginBottom: '10px' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.76rem',
        textAlign: 'left',
        border: '1.5px solid #0f172a',
        pageBreakInside: 'auto',
        breakInside: 'auto',
      }}>
        <thead>
          <tr style={{ background: '#0f172a', color: '#ffffff' }}>
            <th style={{ padding: '5px 6px', width: '32px', textAlign: 'center', borderRight: '1px solid #334155' }}>#</th>
            <th style={{ padding: '5px 8px', borderRight: '1px solid #334155' }}>Product Description</th>
            <th style={{ padding: '5px 6px', width: '70px', textAlign: 'center', borderRight: '1px solid #334155' }}>Warranty</th>
            {!isChalan && <th style={{ padding: '5px 8px', width: '85px', textAlign: 'right', borderRight: '1px solid #334155' }}>Unit Cost</th>}
            <th style={{ padding: '5px 6px', width: '48px', textAlign: 'center', borderRight: !isChalan ? '1px solid #334155' : 'none' }}>Qty</th>
            {!isChalan && <th style={{ padding: '5px 8px', width: '95px', textAlign: 'right' }}>Total Cost</th>}
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
                  borderBottom: '1px solid #cbd5e1',
                  background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid',
                }}
              >
                <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 600, color: '#64748b', borderRight: '1px solid #cbd5e1' }}>
                  {idx + 1}
                </td>
                <td style={{ padding: '4px 8px', borderRight: '1px solid #cbd5e1' }}>
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
                <td style={{ padding: '4px 6px', textAlign: 'center', color: '#475569', borderRight: '1px solid #cbd5e1' }}>
                  {item.warranty_months ? `${item.warranty_months} Mos` : '—'}
                </td>
                {!isChalan && (
                  <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 600, borderRight: '1px solid #cbd5e1' }}>
                    {taka(cost)}
                  </td>
                )}
                <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 800, color: '#0284c7', borderRight: !isChalan ? '1px solid #cbd5e1' : 'none' }}>
                  {qty}
                </td>
                {!isChalan && (
                  <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                    {taka(total)}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={{ background: '#f1f5f9', borderTop: '2px solid #0f172a', fontWeight: 800 }}>
            <td colSpan={!isChalan ? 4 : 3} style={{ padding: '5px 8px', textAlign: 'right', color: '#0f172a', borderRight: '1px solid #cbd5e1' }}>
              TOTAL SUMMARY:
            </td>
            <td style={{ padding: '5px 6px', textAlign: 'center', color: '#0284c7', borderRight: !isChalan ? '1px solid #cbd5e1' : 'none', fontWeight: 900 }}>
              {totalQty}
            </td>
            {!isChalan && (
              <td style={{ padding: '5px 8px', textAlign: 'right', color: '#0f172a', fontWeight: 900 }}>
                {taka(totalAmount)}
              </td>
            )}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
