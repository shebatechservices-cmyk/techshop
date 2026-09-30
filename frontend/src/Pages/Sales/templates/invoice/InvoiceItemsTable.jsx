import React from 'react';
import { taka, formatDecimal } from '../printModalHelpers';

export default function InvoiceItemsTable({
  items = [],
  isChalan = false,
}) {
  return (
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        border: '1px solid #475569',
        marginBottom: '6px',
        fontSize: '0.72rem',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <thead>
        <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #475569' }}>
          <th style={{ border: '1px solid #475569', padding: '3px 4px', textAlign: 'center', width: '28px', color: '#0f172a', fontSize: '0.68rem', fontWeight: 800 }}>SL</th>
          <th style={{ border: '1px solid #475569', padding: '3px 6px', textAlign: 'left', color: '#0f172a', fontSize: '0.68rem', fontWeight: 800 }}>Product Description & Serials</th>
          <th style={{ border: '1px solid #475569', padding: '3px 4px', textAlign: 'center', width: '65px', color: '#0f172a', fontSize: '0.68rem', fontWeight: 800 }}>Warranty</th>
          <th style={{ border: '1px solid #475569', padding: '3px 4px', textAlign: 'right', width: '40px', color: '#0f172a', fontSize: '0.68rem', fontWeight: 800 }}>Qty</th>
          <th style={{ border: '1px solid #475569', padding: '3px 4px', textAlign: 'center', width: '36px', color: '#0f172a', fontSize: '0.68rem', fontWeight: 800 }}>UoM</th>
          {!isChalan && (
            <>
              <th style={{ border: '1px solid #475569', padding: '3px 6px', textAlign: 'right', width: '75px', color: '#0f172a', fontSize: '0.68rem', fontWeight: 800 }}>Unit Price</th>
              <th style={{ border: '1px solid #475569', padding: '3px 6px', textAlign: 'right', width: '85px', color: '#0f172a', fontSize: '0.68rem', fontWeight: 800 }}>Amount</th>
            </>
          )}
        </tr>
      </thead>
      <tbody>
        {items.map((it, idx) => (
          <tr key={idx} style={{ borderBottom: '1px solid #64748b', pageBreakInside: 'avoid' }}>
            <td style={{ border: '1px solid #64748b', padding: '2px 4px', textAlign: 'center', color: '#475569', fontSize: '0.7rem' }}>{idx + 1}</td>
            <td style={{ border: '1px solid #64748b', padding: '2px 6px' }}>
              <div style={{ color: '#0f172a', fontSize: '0.72rem', fontWeight: 700, lineHeight: 1.25 }}>
                {it.name}
              </div>
              {it.serials && it.serials.length > 0 && (
                <div style={{ marginTop: '1px', fontSize: '0.64rem', color: '#0284c7', fontFamily: 'monospace', fontWeight: 600, wordBreak: 'break-all' }}>
                  <strong>S/N:</strong> {it.serials.join(', ')}
                </div>
              )}
            </td>
            <td style={{ border: '1px solid #64748b', padding: '2px 4px', textAlign: 'center', color: '#334155', fontSize: '0.68rem', fontWeight: 600 }}>
              {it.warranty || '—'}
            </td>
            <td style={{ border: '1px solid #64748b', padding: '2px 4px', textAlign: 'right', fontWeight: 700, fontSize: '0.72rem' }}>
              {formatDecimal(it.qty)}
            </td>
            <td style={{ border: '1px solid #64748b', padding: '2px 4px', textAlign: 'center', color: '#475569', fontSize: '0.68rem' }}>
              {it.uom}
            </td>
            {!isChalan && (
              <>
                <td style={{ border: '1px solid #64748b', padding: '2px 6px', textAlign: 'right', color: '#334155', fontSize: '0.72rem' }}>
                  {taka(it.unitPrice)}
                </td>
                <td style={{ border: '1px solid #64748b', padding: '2px 6px', textAlign: 'right', fontWeight: 800, color: '#0f172a', fontSize: '0.72rem' }}>
                  {taka(it.amount)}
                </td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
