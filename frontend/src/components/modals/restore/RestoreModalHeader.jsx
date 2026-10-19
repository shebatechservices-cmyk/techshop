import React from 'react';

export default function RestoreModalHeader({
  title,
  isDemoRestore,
  isRestoring,
  onClose,
}) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #0369a1 0%, #0284c7 100%)',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
          }}
        >
          {isDemoRestore ? '🌱' : '🔄'}
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>
            {title}
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#e0f2fe' }}>
            PostgreSQL Safe Snapshot Recovery Module
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        disabled={isRestoring}
        style={{
          background: 'rgba(255, 255, 255, 0.15)',
          border: 'none',
          color: '#ffffff',
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.85rem',
        }}
      >
        ✕
      </button>
    </div>
  );
}
