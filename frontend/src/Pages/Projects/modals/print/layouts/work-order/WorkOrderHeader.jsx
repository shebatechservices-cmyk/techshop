import React from 'react';

export default function WorkOrderHeader({
  shop = {},
  isCustomerCopy,
  project = {},
  jobDateStr,
}) {
  return (
    <>
      <div
        style={{
          height: '3px',
          background: 'linear-gradient(90deg, #1e3a8a 0%, #0284c7 50%, #16a34a 100%)',
          marginBottom: '10px',
        }}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '1.5px solid #0f172a',
          paddingBottom: '10px',
          marginBottom: '12px',
        }}
      >
        <div style={{ maxWidth: '60%' }}>
          <h1
            style={{
              margin: 0,
              fontSize: '1.45rem',
              fontWeight: 900,
              color: '#0f172a',
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
            }}
          >
            {shop.shop_name || 'Sheba Technology & Networking'}
          </h1>
          <div
            style={{
              fontSize: '0.82rem',
              color: '#2563eb',
              fontWeight: 700,
              marginTop: '1px',
            }}
          >
            {shop.shop_title || 'Professional CCTV, IT & Network Solutions'}
          </div>
          <div
            style={{
              fontSize: '0.75rem',
              color: '#475569',
              marginTop: '3px',
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            <span>📍 {shop.address || 'B-Baria, Dhaka, Bangladesh'}</span>
            <span>•</span>
            <span>📞 {shop.phone || '01722578860'}</span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              display: 'inline-block',
              background: '#0f172a',
              color: '#ffffff',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '0.74rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {isCustomerCopy
              ? 'CUSTOMER DELIVERY & HANDOVER SLIP'
              : 'TECHNICAL WORK ORDER & JOB CARD'}
          </div>
          <div
            style={{
              marginTop: '5px',
              fontSize: '0.85rem',
              fontWeight: 800,
              color: '#0f172a',
            }}
          >
            Job Code:{' '}
            <span
              style={{
                color: '#1d4ed8',
                fontFamily: 'monospace',
                fontSize: '0.92rem',
              }}
            >
              {project.project_code}
            </span>
          </div>
          <div
            style={{
              fontSize: '0.74rem',
              color: '#64748b',
              marginTop: '2px',
            }}
          >
            Date: <strong>{jobDateStr}</strong>
          </div>
        </div>
      </div>
    </>
  );
}
