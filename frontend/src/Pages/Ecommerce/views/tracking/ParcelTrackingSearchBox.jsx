import React from 'react';

export default function ParcelTrackingSearchBox({
  trackQuery,
  setTrackQuery,
  handleTrackSearch,
  trackingLoading,
  trackingError,
}) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #e2e8f0',
        marginBottom: '20px',
      }}
    >
      <h3
        style={{
          margin: '0 0 6px 0',
          fontSize: '1.3rem',
          fontWeight: 900,
          color: '#0f172a',
        }}
      >
        📦 Track Your Parcel / Order
      </h3>
      <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '0.86rem' }}>
        Enter your Order Number (e.g. ECOM-123456) or Customer Mobile Number to see real-time delivery status
      </p>

      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={trackQuery}
          onChange={(e) => setTrackQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleTrackSearch();
          }}
          placeholder="e.g. ECOM-482910 or 017XXXXXXXX"
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1.5px solid #0d9488',
            fontSize: '0.92rem',
            outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={() => handleTrackSearch()}
          disabled={trackingLoading}
          style={{
            padding: '10px 22px',
            background: '#0d9488',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 800,
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          {trackingLoading ? 'Searching...' : '🔍 Track Parcel'}
        </button>
      </div>

      {trackingError && (
        <div
          style={{
            marginTop: '14px',
            padding: '10px 14px',
            background: '#fee2e2',
            color: '#b91c1c',
            borderRadius: '8px',
            fontSize: '0.85rem',
          }}
        >
          ⚠️ {trackingError}
        </div>
      )}
    </div>
  );
}
