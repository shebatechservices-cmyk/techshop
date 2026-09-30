import React from 'react';

const money = (val) => Number.parseFloat(val || 0) || 0;
const taka = (val) => `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function SearchPurchasesSection({ purchases = [], quotations = [], onSelect }) {
  if ((!purchases || purchases.length === 0) && (!quotations || quotations.length === 0)) {
    return null;
  }

  return (
    <>
      {/* 4. PURCHASE ORDERS */}
      {purchases && purchases.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              color: '#0891b2',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>📑</span> Purchase Orders ({purchases.length})
          </div>
          {purchases.map((item) => (
            <div
              key={`po-${item.id}`}
              onClick={() =>
                onSelect({
                  section: 'purchases',
                  tab: 'history',
                  search: item.po_number || String(item.id),
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
              onMouseEnter={(e) => (e.currentTarget.style.background = '#ecfeff')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#0e7490', fontSize: '0.9rem' }}>
                    {item.po_number || `PO-${item.id}`}
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: '#cffafe',
                      color: '#0891b2',
                    }}
                  >
                    {item.status || 'PO'}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                  Supplier: <strong>{item.supplier_name}</strong> {item.supplier_phone ? `(${item.supplier_phone})` : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                  {taka(item.total_cost)}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#0891b2', fontWeight: 600 }}>
                  Go to Purchase History →
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. PURCHASE QUOTATIONS */}
      {quotations && quotations.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              color: '#9333ea',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>📋</span> Purchase Quotations ({quotations.length})
          </div>
          {quotations.map((item) => (
            <div
              key={`pq-${item.id}`}
              onClick={() =>
                onSelect({
                  section: 'purchases',
                  tab: 'quotations',
                  search: item.quotation_no || item.reference || String(item.id),
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
              onMouseEnter={(e) => (e.currentTarget.style.background = '#faf5ff')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#7e22ce', fontSize: '0.9rem' }}>
                    {item.quotation_no || `RFQ-${item.id}`}
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: '#f3e8ff',
                      color: '#9333ea',
                    }}
                  >
                    {item.status || 'quote'}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                  Supplier: <strong>{item.supplier_name || 'Vendor'}</strong>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                  {taka(item.total_amount)}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#9333ea', fontWeight: 600 }}>
                  Go to Purchase Quotations →
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
