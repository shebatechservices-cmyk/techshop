import React from 'react';

export default function ClearDataSuccessView({ successInfo, onClose }) {
  if (!successInfo) return null;

  return (
    <div style={{ textAlign: 'center', padding: '10px 0' }}>
      <div style={{ fontSize: '3rem', marginBottom: '10px' }}>✅</div>
      <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#4ade80' }}>
        Data Cleared Successfully!
      </h4>
      <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '0 0 16px 0' }}>
        {successInfo.message}
      </p>
      {successInfo.backupName && (
        <div style={{
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '10px',
          fontSize: '0.76rem',
          color: '#38bdf8',
          marginBottom: '18px',
          fontFamily: 'monospace'
        }}>
          🛡️ Safety Backup Snapshot: {successInfo.backupName}
        </div>
      )}
      <button
        type="button"
        onClick={onClose}
        style={{
          background: '#10b981',
          color: '#fff',
          border: 'none',
          padding: '9px 24px',
          borderRadius: '8px',
          fontSize: '0.85rem',
          fontWeight: 700,
          cursor: 'pointer'
        }}
      >
        Done (Close)
      </button>
    </div>
  );
}
