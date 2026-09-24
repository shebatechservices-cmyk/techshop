import React, { useState } from 'react';

export default function LicenseBanner({ licenseInfo, onRefresh }) {
  const [dismissedUpdates, setDismissedUpdates] = useState(false);
  const [dismissedWarningIds, setDismissedWarningIds] = useState(new Set());

  if (!licenseInfo) return null;

  const warnings = (licenseInfo.warnings || []).filter(
    (w) => !dismissedWarningIds.has(`${w.type}-${w.days_left}`)
  );
  const showUpdate = licenseInfo.update_available && !dismissedUpdates;

  if (warnings.length === 0 && !showUpdate) return null;

  const dismissWarning = (key) => {
    setDismissedWarningIds((prev) => new Set([...prev, key]));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
      {/* 1. Software Update Available Banner */}
      {showUpdate && (
        <div
          style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%)',
            border: '1px solid #38bdf8',
            borderRadius: '10px',
            padding: '10px 16px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)',
            animation: 'fadeIn 0.3s ease-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>🚀</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.88rem', letterSpacing: '0.3px' }}>
                New App Update Available: <span style={{ color: '#a5f3fc' }}>v{licenseInfo.latest_version}</span>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#e0f2fe' }}>
                You are currently running v{licenseInfo.current_version}. Contact vendor support or your administrator to apply the update.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => onRefresh && onRefresh()}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                color: '#ffffff',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🔄 Check Sync
            </button>
            <button
              type="button"
              onClick={() => setDismissedUpdates(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#bae6fd',
                fontSize: '1rem',
                cursor: 'pointer',
                padding: '2px 6px',
              }}
              title="Dismiss for this session"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 2. Expiration Warnings (< 15 Days) */}
      {warnings.map((w) => {
        const key = `${w.type}-${w.days_left}`;
        const isCritical = w.severity === 'critical' || w.days_left <= 3;
        return (
          <div
            key={key}
            style={{
              background: isCritical
                ? 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%)'
                : 'linear-gradient(135deg, #78350f 0%, #b45309 100%)',
              border: `1px solid ${isCritical ? '#f87171' : '#fbbf24'}`,
              borderRadius: '10px',
              padding: '10px 16px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: isCritical
                ? '0 4px 14px rgba(220, 38, 38, 0.35)'
                : '0 4px 14px rgba(217, 119, 6, 0.25)',
              animation: 'fadeIn 0.3s ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.4rem' }}>{isCritical ? '🚨' : '⚠️'}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>
                  {w.message}
                </div>
                <div style={{ fontSize: '0.74rem', color: isCritical ? '#fecaca' : '#fef3c7' }}>
                  Expires on: <strong>{new Date(w.expiry_date).toLocaleDateString()}</strong> • Renew now to prevent service interruption.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: isCritical ? '#fee2e2' : '#fef08a',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                {w.days_left <= 0 ? 'EXPIRED' : `${w.days_left} Days Left`}
              </span>
              <button
                type="button"
                onClick={() => dismissWarning(key)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isCritical ? '#fca5a5' : '#fde68a',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  padding: '2px 6px',
                }}
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
