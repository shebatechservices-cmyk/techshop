import React from 'react';

const money = (val) => Number.parseFloat(val || 0) || 0;
const taka = (val) => `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function SearchPartiesSection({ customers = [], suppliers = [], onSelect }) {
  if ((!customers || customers.length === 0) && (!suppliers || suppliers.length === 0)) {
    return null;
  }

  return (
    <>
      {/* 3. CUSTOMERS */}
      {customers && customers.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              color: '#0284c7',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>👤</span> Customers ({customers.length})
          </div>
          {customers.map((item) => (
            <div
              key={`cust-${item.id}`}
              onClick={() =>
                onSelect({
                  section: 'sales',
                  tab: 'customers',
                  search: item.name || item.phone,
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
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f9ff')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#0369a1', fontSize: '0.9rem' }}>
                    {item.name}
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: '#e0f2fe',
                      color: '#0284c7',
                    }}
                  >
                    {item.customer_type || 'Retail'}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                  📞 {item.phone || 'No phone'} {item.address ? `• 📍 ${item.address}` : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: money(item.receivable_balance) > 0 ? '#ef4444' : '#10b981', fontSize: '0.85rem' }}>
                  {money(item.receivable_balance) > 0 ? 'Due:' : 'Advance:'} {taka(item.receivable_balance)}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#0284c7', fontWeight: 600 }}>
                  Go to Customer List →
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 6. SUPPLIERS */}
      {suppliers && suppliers.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              color: '#059669',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🏢</span> Suppliers ({suppliers.length})
          </div>
          {suppliers.map((item) => (
            <div
              key={`sup-${item.id}`}
              onClick={() =>
                onSelect({
                  section: 'purchases',
                  tab: 'suppliers',
                  search: item.name || item.phone,
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
              onMouseEnter={(e) => (e.currentTarget.style.background = '#ecfdf5')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#047857', fontSize: '0.9rem' }}>
                    {item.name}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                  📞 {item.phone || item.mobile || 'No phone'} {item.contact_person ? `• Contact: ${item.contact_person}` : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: money(item.payable_balance) > 0 ? '#ef4444' : '#10b981', fontSize: '0.85rem' }}>
                  {money(item.payable_balance) > 0 ? 'Due:' : 'Advance Given:'} {taka(item.payable_balance)}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 600 }}>
                  Go to Supplier List →
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
