import React from 'react';

export default function DayCloseHeader({ selectedDate, setSelectedDate, onClose }) {
  return (
    <div
      style={{
        padding: '20px 24px',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#ffffff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.4rem' }}>🌅</span>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
            Daily Cash Closing & Register Report (Z-Report)
          </h3>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
          Comprehensive end-of-day cash drawer, sales, and expense reconciliation report
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{
            padding: '6px 10px',
            borderRadius: '8px',
            border: '1px solid #475569',
            background: '#1e293b',
            color: '#fff',
            fontSize: '0.85rem',
            outline: 'none',
            cursor: 'pointer',
          }}
        />
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            border: 'none',
            color: '#ffffff',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
