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
      <div style={{ flex: 1, paddingRight: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {showLogo && company.logo ? (
            <img
              src={company.logo}
              alt={company.name || 'Company Logo'}
              style={{
                maxHeight: '52px',
                maxWidth: '140px',
                objectFit: 'contain',
                display: 'block',
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.parentElement?.querySelector('.brand-avatar-fallback');
                if (fallback) fallback.style.display = 'grid';
              }}
            />
          ) : null}

          <div
            className="brand-avatar-fallback"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0284c7, #0f172a)',
              color: '#fff',
              display: showLogo && company.logo ? 'none' : 'grid',
              placeItems: 'center',
              fontWeight: 900,
              fontSize: '1.15rem',
              flexShrink: 0,
            }}
          >
            {company.name ? company.name.substring(0, 2).toUpperCase() : 'ST'}
          </div>

          <div>
            <h1 style={{ margin: 0, fontSize: '1.38rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 1.15 }}>
              {company.name}
            </h1>
            {company.tagline && (
              <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
                {company.tagline}
              </p>
            )}
          </div>
        </div>

        <div style={{ marginTop: '6px', fontSize: '0.75rem', color: '#475569', lineHeight: 1.4 }}>
          {company.address && <div>{company.address}</div>}
          <div>
            {company.phone && `Phone: ${company.phone}`}
            {company.phone && company.email && ' · '}
            {company.email && `Email: ${company.email}`}
            {(company.phone || company.email) && company.web && ' · '}
            {company.web && `Web: ${company.web}`}
          </div>
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
