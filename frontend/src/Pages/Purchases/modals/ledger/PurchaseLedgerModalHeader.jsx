import React from 'react';

export default function PurchaseLedgerModalHeader({ poNumber, dateStr, onClose }) {
  return (
    <div
      style={{
        padding: '16px 24px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#f8fafc',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '1.4rem' }}>🧾</span>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              Purchase Order Ledger Preview
            </h2>
            <span
              style={{
                background: '#e0f2fe',
                color: '#0369a1',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 700,
              }}
            >
              {poNumber}
            </span>
          </div>
          <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
            Issued: {dateStr}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          fontSize: '1.3rem',
          color: '#64748b',
          cursor: 'pointer',
          padding: '4px',
          lineHeight: 1,
        }}
      >
        ✕
      </button>
    </div>
  );
}
