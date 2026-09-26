import React from 'react';

export default function PurchaseShareModal({
  isOpen,
  onClose,
  shareLoading,
  selectedFormat,
  setSelectedFormat,
  handleExecuteShare,
  poNumber,
  supplierName,
  supplierPhone,
  supplierEmail,
  shareStep,
  activeAction,
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
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>Share & Export Purchase Order</h4>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{poNumber} · {supplierName}</span>
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
          {/* Format Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Select File Format:
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
              {shareStep === 'rendering' && 'Rendering purchase order document...'}
              {shareStep === 'uploading' && 'Uploading secure shareable link...'}
              {shareStep === 'sharing' && 'Opening native share dialog...'}
              {shareStep === 'opening_intent' && 'Opening messaging application...'}
              {!shareStep && 'Processing export request...'}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleExecuteShare('whatsapp')}
              disabled={shareLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: shareLoading ? 'not-allowed' : 'pointer',
                opacity: shareLoading && activeAction !== 'whatsapp' ? 0.6 : 1,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>💬</span> Share via WhatsApp
              </span>
              <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px' }}>
                {selectedFormat.toUpperCase()}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleExecuteShare('email')}
              disabled={shareLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: '#475569',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: shareLoading ? 'not-allowed' : 'pointer',
                opacity: shareLoading && activeAction !== 'email' ? 0.6 : 1,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>✉️</span> Share via Email
              </span>
              <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px' }}>
                {selectedFormat.toUpperCase()}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleExecuteShare('download')}
              disabled={shareLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: '#0ea5e9',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: shareLoading ? 'not-allowed' : 'pointer',
                opacity: shareLoading && activeAction !== 'download' ? 0.6 : 1,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📥</span> Download {selectedFormat.toUpperCase()} Directly
              </span>
              <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px' }}>
                Save to Device
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
