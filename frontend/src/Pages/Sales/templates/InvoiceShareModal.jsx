import React from 'react';

export default function InvoiceShareModal({
  isOpen,
  onClose,
  shareLoading,
  selectedFormat,
  setSelectedFormat,
  handleExecuteShare,
  docNumber,
  customerName,
  customerPhone,
  customerEmail,
  shareStep,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="no-print"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110000,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={() => !shareLoading && onClose()}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '440px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          fontFamily: "'Inter', sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: '#0f172a',
            color: '#ffffff',
            padding: '12px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>📤</span>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>Share & Export Document</h4>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{docNumber} · {customerName}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => !shareLoading && onClose()}
            disabled={shareLoading}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '1.2rem',
              cursor: shareLoading ? 'not-allowed' : 'pointer',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Format Selection Prompt */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Select File Format (ফাইল ফরম্যাট নির্বাচন করুন):
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setSelectedFormat('pdf')}
                disabled={shareLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px',
                  borderRadius: '8px',
                  border: selectedFormat === 'pdf' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                  background: selectedFormat === 'pdf' ? '#f0f9ff' : '#ffffff',
                  color: selectedFormat === 'pdf' ? '#0369a1' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: shareLoading ? 'not-allowed' : 'pointer',
                }}
              >
                <span>📄</span> PDF Document
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat('jpg')}
                disabled={shareLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px',
                  borderRadius: '8px',
                  border: selectedFormat === 'jpg' ? '2px solid #7c3aed' : '1px solid #cbd5e1',
                  background: selectedFormat === 'jpg' ? '#faf5ff' : '#ffffff',
                  color: selectedFormat === 'jpg' ? '#6d28d9' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: shareLoading ? 'not-allowed' : 'pointer',
                }}
              >
                <span>🖼️</span> High-Res JPG
              </button>
            </div>
          </div>

          {/* Status Notice if Loading */}
          {shareLoading && (
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px',
                textAlign: 'center',
                fontSize: '0.8rem',
                color: '#0284c7',
                fontWeight: 600,
              }}
            >
              <span style={{ display: 'inline-block', marginRight: '6px' }}>⏳</span>
              {shareStep || 'Processing document...'}
            </div>
          )}

          {/* Action Destination Buttons */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              Choose Destination / Channel (শেয়ার বা ডাউনলোডের অপশন):
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* WhatsApp Direct */}
              <button
                type="button"
                onClick={() => handleExecuteShare('whatsapp')}
                disabled={shareLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #22c55e',
                  background: '#f0fdf4',
                  color: '#15803d',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: shareLoading ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.2rem' }}>💬</span>
                  <div>
                    <div>Share to WhatsApp</div>
                    <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 500 }}>
                      {customerPhone ? `Send directly to ${customerPhone}` : 'Share to WhatsApp chat'}
                    </div>
                  </div>
                </div>
                <span>➔</span>
              </button>

              {/* Direct Download */}
              <button
                type="button"
                onClick={() => handleExecuteShare('download')}
                disabled={shareLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #0284c7',
                  background: '#f0f9ff',
                  color: '#0369a1',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: shareLoading ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.2rem' }}>💾</span>
                  <div>
                    <div>Save & Download {selectedFormat.toUpperCase()}</div>
                    <div style={{ fontSize: '0.7rem', color: '#0284c7', fontWeight: 500 }}>
                      Save file directly to your device storage
                    </div>
                  </div>
                </div>
                <span>⬇️</span>
              </button>

              {/* Email Client */}
              <button
                type="button"
                onClick={() => handleExecuteShare('email')}
                disabled={shareLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: '#334155',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: shareLoading ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.2rem' }}>✉️</span>
                  <div>
                    <div>Send via Email Client</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 400 }}>
                      {customerEmail ? `Compose email to ${customerEmail}` : 'Open default mail app with details'}
                    </div>
                  </div>
                </div>
                <span>➔</span>
              </button>

              {/* Native Mobile / Desktop Share */}
              <button
                type="button"
                onClick={() => handleExecuteShare('web_share')}
                disabled={shareLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: '#334155',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: shareLoading ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.2rem' }}>📱</span>
                  <div>
                    <div>More Share Options (Apps / AirDrop / Bluetooth)</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 400 }}>
                      Open system share dialog
                    </div>
                  </div>
                </div>
                <span>➔</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
