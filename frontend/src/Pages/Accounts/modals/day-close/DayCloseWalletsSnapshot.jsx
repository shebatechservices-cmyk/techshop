import React from 'react';

export default function DayCloseWalletsSnapshot({ accounts }) {
  return (
    <div
      style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '16px',
      }}
    >
      <h4
        style={{
          margin: '0 0 10px',
          fontSize: '0.9rem',
          color: '#0f172a',
          fontWeight: 700,
        }}
      >
        💼 End-of-Day Wallet Balances
      </h4>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '10px',
        }}
      >
        {accounts.map((acc) => (
          <div
            key={acc.id}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '10px 12px',
            }}
          >
            <span
              style={{
                fontSize: '0.78rem',
                color: '#64748b',
                fontWeight: 600,
              }}
            >
              {acc.name}
            </span>
            <div
              style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                color: '#0f172a',
                marginTop: '2px',
              }}
            >
              ৳{' '}
              {Number(acc.balance || 0).toLocaleString('en-BD', {
                minimumFractionDigits: 2,
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
