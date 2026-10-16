import React from 'react';

export default function MultiTenderHeader({
  acceptedCount = 0,
  totalCount = 0,
  onAddTender,
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '5px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            fontSize: '0.74rem',
            fontWeight: 800,
            color: '#1e293b',
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
          }}
        >
          💳 Payment Details (Multi-Tender)
        </span>
        <span
          style={{
            fontSize: '0.68rem',
            color: '#15803d',
            background: '#dcfce7',
            padding: '1px 6px',
            borderRadius: '10px',
            fontWeight: 700,
          }}
        >
          {acceptedCount} of {totalCount} Accepted
        </span>
      </div>

      <button
        type="button"
        onClick={onAddTender}
        style={{
          padding: '3px 8px',
          borderRadius: '4px',
          border: '1px dashed #0284c7',
          background: '#f0f9ff',
          color: '#0284c7',
          fontWeight: 700,
          fontSize: '0.72rem',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          lineHeight: 1.2,
        }}
        title="Add another tender payment entry"
      >
        <span>＋</span> Add more
      </button>
    </div>
  );
}
