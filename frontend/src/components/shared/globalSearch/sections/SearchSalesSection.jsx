import React from 'react';

const money = (val) => Number.parseFloat(val || 0) || 0;
const taka = (val) => `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function SearchSalesSection({ sales = [], quotations = [], onSelect }) {
  if ((!sales || sales.length === 0) && (!quotations || quotations.length === 0)) {
    return null;
  }

  return (
    <>
      {/* 1. SALES INVOICES */}
      {sales && sales.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              color: '#16a34a',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🛒</span> Sale Invoices ({sales.length})
          </div>
          {sales.map((item) => (
            <div
              key={`sale-${item.id}`}
              onClick={() =>
                onSelect({
                  section: 'sales',
                  tab: 'history',
                  search: item.invoice_no || String(item.id),
                })
              }
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f0fdf4')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#15803d', fontSize: '0.9rem' }}>
                    {item.invoice_no || `INV-${item.id}`}
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: item.payment_status === 'paid' ? '#dcfce7' : '#fef3c7',
                      color: item.payment_status === 'paid' ? '#15803d' : '#b45309',
                    }}
                  >
                    {item.payment_status || 'invoice'}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                  Customer: <strong>{item.customer_name}</strong> {item.customer_phone ? `(${item.customer_phone})` : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                  {taka(item.total_amount)}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#0284c7', fontWeight: 600 }}>
                  Go to Sales History →
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. SALE QUOTATIONS */}
      {quotations && quotations.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              color: '#4f46e5',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>📄</span> Sale Quotations ({quotations.length})
          </div>
          {quotations.map((item) => (
            <div
              key={`quote-${item.id}`}
              onClick={() =>
                onSelect({
                  section: 'sales',
                  tab: 'quotations',
                  search: item.quotation_no || String(item.id),
                })
              }
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f3ff')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#4f46e5', fontSize: '0.9rem' }}>
                    {item.quotation_no || `QTN-${item.id}`}
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: '#ede9fe',
                      color: '#4f46e5',
                    }}
                  >
                    {item.status || 'quotation'}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                  Client: <strong>{item.customer_name || 'Client'}</strong> {item.customer_phone ? `(${item.customer_phone})` : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                  {taka(item.total_amount)}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#4f46e5', fontWeight: 600 }}>
                  Go to Quotation History →
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
