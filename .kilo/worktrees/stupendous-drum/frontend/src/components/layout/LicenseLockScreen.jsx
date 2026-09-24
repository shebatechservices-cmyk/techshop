import React, { useState } from 'react';

export default function LicenseLockScreen({ licenseInfo, onReactivated }) {
  const [keyInput, setKeyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isSuspended = licenseInfo?.status === 'suspended';
  const isExpired = licenseInfo?.status === 'expired';

  const handleActivate = async (e) => {
    e.preventDefault();
    if (!keyInput.trim()) {
      setErrorMsg('Please enter a valid Redemption Code or License Key.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/license/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: keyInput.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'License successfully reactivated! Reloading system...');
        setTimeout(() => {
          if (onReactivated) onReactivated();
          else window.location.reload();
        }, 1500);
      } else {
        setErrorMsg(data.message || 'Failed to redeem code. Please check the code and try again.');
      }
    } catch (err) {
      setErrorMsg('Network error. Failed to connect to licensing server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(135deg, #090d16 0%, #0f172a 50%, #1e1b4b 100%)',
        zIndex: 9999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          background: 'rgba(30, 41, 59, 0.95)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(239, 68, 68, 0.2)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '560px',
          padding: '36px',
          textAlign: 'center',
          backdropFilter: 'blur(16px)',
          animation: 'fadeIn 0.3s ease-out',
        }}
      >
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '2px solid #ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.4rem',
            margin: '0 auto 20px',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)',
          }}
        >
          🔒
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 8px', color: '#ffffff' }}>
          {isSuspended ? 'Software Access Suspended' : 'Software License Expired'}
        </h2>

        <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: '1.5', margin: '0 0 24px' }}>
          {licenseInfo?.vendor_message ||
            (isSuspended
              ? 'This software installation has been locked by the vendor. To restore service, please contact vendor customer support or provide a renewed license key.'
              : 'Your commercial subscription period has ended. Please enter a valid renewal key below or contact your vendor.')}
        </p>

        {/* Hardware & System Diagnostic Box */}
        <div
          style={{
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '10px',
            padding: '12px 16px',
            fontSize: '0.76rem',
            textAlign: 'left',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: '#64748b' }}>Client App ID:</span>
            <span style={{ color: '#38bdf8', fontFamily: 'monospace', fontWeight: 700 }}>
              {licenseInfo?.client_app_id || 'CLIENT-SHEBA-TECH-8801'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: '#64748b' }}>Hardware Fingerprint:</span>
            <span style={{ color: '#cbd5e1', fontFamily: 'monospace', fontWeight: 600 }}>
              {licenseInfo?.hardware_id || 'UNKNOWN-NODE'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: '#64748b' }}>Domain / Host:</span>
            <span style={{ color: '#cbd5e1' }}>{licenseInfo?.domain_name || window.location.hostname}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>Application Version:</span>
            <span style={{ color: '#cbd5e1' }}>v{licenseInfo?.current_version || '16.9.26'}</span>
          </div>
        </div>

        {/* License Key Reactivation Form */}
        <form onSubmit={handleActivate} style={{ textAlign: 'left', marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '6px' }}>
            Enter Valid License Key / Activation Code:
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="e.g. SHEBA-ENT-2026-XXXX-PRO"
              style={{
                flex: 1,
                padding: '11px 14px',
                background: '#0f172a',
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontFamily: 'monospace',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '11px 20px',
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
              }}
            >
              {loading ? 'Activating...' : 'Activate'}
            </button>
          </div>
        </form>

        {errorMsg && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#fca5a5',
              fontSize: '0.78rem',
              marginBottom: '16px',
            }}
          >
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid #10b981',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#6ee7b7',
              fontSize: '0.78rem',
              marginBottom: '16px',
            }}
          >
            ✓ {successMsg}
          </div>
        )}

        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
          Vendor Support: <strong>support@shebatech.com.bd</strong> • Hotline: <strong>+880 1722-578860</strong>
        </div>
      </div>
    </div>
  );
}
