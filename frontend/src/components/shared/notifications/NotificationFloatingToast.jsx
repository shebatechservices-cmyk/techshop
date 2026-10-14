import React from 'react';

export default function NotificationFloatingToast({ floatingToast, onClick, onClose }) {
  if (!floatingToast) return null;

  return (
    <div
      onClick={() => onClick(floatingToast)}
      style={{
        position: 'fixed',
        top: '70px',
        right: '24px',
        zIndex: 999999,
        background: '#0f172a',
        color: '#fff',
        padding: '12px 16px',
        borderRadius: '10px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        maxWidth: '380px',
        cursor: 'pointer',
        border: '1px solid #334155',
        animation: 'slideIn 0.25s ease-out',
      }}
    >
      <span style={{ fontSize: '1.4rem' }}>{floatingToast.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: '700', fontSize: '0.85rem', color: '#38bdf8' }}>
            {floatingToast.title}
          </span>
          <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
            {floatingToast.timestamp}
          </span>
        </div>
        <p
          style={{
            margin: '2px 0 0 0',
            fontSize: '0.78rem',
            color: '#cbd5e1',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {floatingToast.message}
        </p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        style={{
          background: 'none',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          fontSize: '0.9rem',
        }}
      >
        ✕
      </button>
    </div>
  );
}
