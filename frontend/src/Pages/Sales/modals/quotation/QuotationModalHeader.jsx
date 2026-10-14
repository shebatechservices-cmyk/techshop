import React from 'react';

export default function QuotationModalHeader({ onClose }) {
  return (
    <div
      style={{
        padding: '18px 24px',
        background: 'linear-gradient(135deg, #312e81 0%, #4338ca 100%)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: '#ffffff',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '1.4rem' }}>📋</span>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
            New Sales Quotation
          </h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#c7d2fe' }}>
            Prepare formal pricing quotes for corporate, wholesale, or retail clients
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        style={{
          background: 'rgba(255,255,255,0.15)',
          border: 'none',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          color: '#fff',
          fontSize: '1.2rem',
          cursor: 'pointer',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        ✕
      </button>
    </div>
  );
}
