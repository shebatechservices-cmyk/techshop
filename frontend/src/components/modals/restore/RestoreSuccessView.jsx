import React from 'react';

export default function RestoreSuccessView({ successInfo, onClose }) {
  return (
    <div style={{ textAlign: 'center', padding: '10px 0' }}>
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.15)',
          color: '#10b981',
          fontSize: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 12px',
        }}
      >
        ✓
      </div>
      <h4
        style={{
          margin: '0 0 8px',
          fontSize: '1.05rem',
          color: '#10b981',
          fontWeight: 800,
        }}
      >
        Database Restored Successfully!
      </h4>
      <p
        style={{
          margin: '0 0 16px',
          fontSize: '0.8rem',
          color: '#94a3b8',
          lineHeight: '1.4',
        }}
      >
        {successInfo.message}
      </p>

      <div
        style={{
          background: '#0f172a',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '0.75rem',
          textAlign: 'left',
          border: '1px solid #334155',
          marginBottom: '16px',
        }}
      >
        <div style={{ color: '#cbd5e1', marginBottom: '4px' }}>
          <strong>Restored File:</strong>{' '}
          <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>
            {successInfo.restoredFile}
          </span>
        </div>
        {successInfo.safetySnapshot && (
          <div style={{ color: '#cbd5e1', marginBottom: '4px' }}>
            <strong>Safety Pre-Backup:</strong>{' '}
            <span style={{ fontFamily: 'monospace', color: '#a7f3d0' }}>
              {successInfo.safetySnapshot}
            </span>
          </div>
        )}
        <div style={{ color: '#64748b' }}>
          <strong>Timestamp:</strong>{' '}
          {new Date(successInfo.restoredAt || Date.now()).toLocaleString()}
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          onClose();
          window.location.reload();
        }}
        style={{
          background: '#10b981',
          color: '#ffffff',
          border: 'none',
          padding: '9px 24px',
          borderRadius: '8px',
          fontSize: '0.82rem',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
        }}
      >
        🔄 Reload App with Restored Data
      </button>
    </div>
  );
}
