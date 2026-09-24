import React, { useState } from 'react';
import API from '../../services/api';

export default function DeviceLimitModal({
  currentDeviceId,
  deviceType = 'desktop',
  activeDevices = [],
  onRetry,
  onLogoutSuccess,
  onClose
}) {
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [devices, setDevices] = useState(activeDevices);

  const handleRemoteLogout = async (targetDeviceId, targetDeviceName) => {
    if (!window.confirm(`Are you sure you want to log out "${targetDeviceName}" to free this slot?`)) return;
    try {
      setLoading(true);
      setStatusMsg('');
      const res = await fetch(`${API}/devices/${targetDeviceId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg(`✓ "${targetDeviceName}" has been logged out! Slot freed.`);
        setDevices((prev) => prev.filter((d) => d.device_id !== targetDeviceId));
        if (onLogoutSuccess) onLogoutSuccess(data);
        // Automatically retry registration after freeing a slot
        setTimeout(() => {
          if (onRetry) onRetry();
        }, 1200);
      } else {
        alert(data.message || 'Failed to logout device.');
      }
    } catch (err) {
      console.error(err);
      alert('Error communicating with device server.');
    } finally {
      setLoading(false);
    }
  };

  const isMobile = deviceType === 'mobile';
  const typeLabel = isMobile ? 'Mobile Phone' : 'Desktop / Laptop';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'sans-serif'
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0'
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
            color: '#ffffff',
            padding: '24px',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
            {isMobile ? '📱' : '💻'}
          </div>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '1.35rem', fontWeight: 800 }}>
            Device Access Limit Reached
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9 }}>
            Maximum 3 {typeLabel}s allowed simultaneously.
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {statusMsg && (
            <div
              style={{
                background: '#f0fdf4',
                color: '#15803d',
                border: '1px solid #bbf7d0',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontWeight: 700,
                marginBottom: '16px'
              }}
            >
              {statusMsg}
            </div>
          )}

          <div style={{ fontSize: '0.86rem', color: '#475569', marginBottom: '16px', lineHeight: 1.5 }}>
            This application is limited to <strong>3 Desktops/Laptops</strong> and <strong>3 Mobile Phones</strong>.
            To connect this device, log out one of the active {typeLabel}s below:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {devices.map((d, idx) => (
              <div
                key={d.device_id || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                    {isMobile ? '📱' : '💻'} {d.device_name}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                    IP: {d.ip_address || 'Local'} • Last active:{' '}
                    {d.last_active ? new Date(d.last_active).toLocaleTimeString() : 'Recent'}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleRemoteLogout(d.device_id, d.device_name)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '6px',
                    border: '1px solid #fca5a5',
                    background: '#fef2f2',
                    color: '#b91c1c',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = '#fee2e2')}
                  onMouseOut={(e) => (e.currentTarget.style.background = '#fef2f2')}
                >
                  🔴 Log Out
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #f1f5f9', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
              Device ID: {currentDeviceId ? currentDeviceId.substring(0, 14) + '...' : 'Unknown'}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#475569',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  ✕ Dismiss & Login
                </button>
              )}
              <button
                type="button"
                disabled={loading}
                onClick={onRetry}
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#0284c7',
                  color: '#ffffff',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🔄 Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
