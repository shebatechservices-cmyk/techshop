import React from 'react';

export default function PurchasePrintHeader({
  company = {},
  showLogo = true,
  isChalan = false,
  poNumber = '',
  dateStr = '',
  order = {},
}) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      borderBottom: '2px solid #0f172a',
      paddingBottom: '10px',
      marginBottom: '10px',
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #0284c7, #0f172a)',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 900,
            fontSize: '1.1rem',
          }}>
            ST
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
              {company.name}
            </h1>
            {company.tagline && (
              <p style={{ margin: '1px 0 0', fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
                {company.tagline}
              </p>
            )}
          </div>
        </div>
        {showLogo && company.logo && (
          <img
            src={company.logo}
            alt={company.name}
            style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '6px', marginTop: '6px' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        <div style={{ marginTop: '5px', fontSize: '0.75rem', color: '#475569', lineHeight: 1.35 }}>
          <div>{company.address}</div>
          <div>Phone: {company.phone} · Email: {company.email}</div>
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <div style={{
          display: 'inline-block',
          padding: '4px 10px',
          borderRadius: '6px',
          background: '#f0f9ff',
          border: '1.5px solid #0284c7',
          color: '#0369a1',
          fontWeight: 800,
          fontSize: '0.88rem',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          Purchase {isChalan ? 'Delivery Challan' : 'Order'}
        </div>
        <div style={{ marginTop: '5px', fontSize: '0.8rem', color: '#0f172a', fontWeight: 700 }}>
          {isChalan ? 'Chalan No: ' : 'PO No: '}<span style={{ color: '#0284c7' }}>{poNumber}</span>
        </div>
        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '1px' }}>
          Date: {dateStr}
        </div>
        {order.transaction_reference && (
          <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: '1px' }}>
            Ref: <strong>{order.transaction_reference}</strong>
          </div>
        )}
      </div>
    </div>
  );
}
