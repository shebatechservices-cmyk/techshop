import React from 'react';
import { taka } from './cardFormatters';

export default function CardSalesDimension({ item, onSelect }) {
  const hasHistory = item.sales_history && item.sales_history.length > 0;

  return (
    <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
        <span>🛒</span> 2. SALES INVOICES {hasHistory ? `(${item.sales_history.length})` : ''}
      </div>
      {hasHistory ? (
        item.sales_history.slice(0, 2).map((sh, idx) => (
          <div
            key={`sh-${idx}`}
            style={{
              fontSize: '0.73rem',
              color: '#334155',
              borderBottom: idx === 0 && item.sales_history.length > 1 ? '1px dashed #cbd5e1' : 'none',
              paddingBottom: '2px',
              marginBottom: '2px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect({
                    section: 'sales',
                    tab: 'history',
                    search: sh.invoice_no,
                  });
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: '#15803d',
                  fontWeight: 800,
                  fontSize: '0.74rem',
                  textDecoration: 'underline',
                  textUnderlineOffset: '2px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                }}
                title={`Click to view Sale Invoice #${sh.invoice_no}`}
              >
                #{sh.invoice_no} ↗
              </button>
              <span style={{ color: '#64748b', fontSize: '0.68rem' }}>
                {sh.sale_date ? new Date(sh.sale_date).toLocaleDateString() : ''}
              </span>
            </div>
            <div style={{ color: '#64748b', fontSize: '0.71rem' }}>
              {sh.customer_name} • {sh.quantity} pcs @ {taka(sh.unit_price)}
            </div>
          </div>
        ))
      ) : (
        <div
          style={{
            fontSize: '0.71rem',
            color: item.matched_serial ? '#059669' : '#94a3b8',
            fontStyle: item.matched_serial ? 'normal' : 'italic',
            fontWeight: item.matched_serial ? 600 : 400,
            padding: '4px 0',
          }}
        >
          {item.matched_serial ? '✓ Unit in stock (Never sold)' : 'No sales recorded yet'}
        </div>
      )}
    </div>
  );
}
