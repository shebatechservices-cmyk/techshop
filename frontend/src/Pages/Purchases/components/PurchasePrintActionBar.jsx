import React from 'react';

export default function PurchasePrintActionBar({
  paperSize = 'a4',
  poNumber = '',
  pageMargin = 'default',
  mode = 'po',
  setMode = () => {},
  handlePrint = () => {},
  shareLoading = false,
  setShowShareModal = () => {},
  onClose = () => {},
}) {
  return (
    <div className="print-actions-bar" style={{
      width: '100%',
      maxWidth: paperSize === 'thermal_80mm' ? '380px' : (paperSize === 'a5' ? '600px' : '840px'),
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: '#0f172a',
      padding: '12px 20px',
      borderRadius: '12px',
      marginBottom: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      color: '#ffffff',
      flexWrap: 'wrap',
      gap: '10px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '1.2rem' }}>🖨️</span>
        <div>
          <strong style={{ fontSize: '1rem', display: 'block' }}>Purchase Order Print Preview</strong>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Order #{poNumber} · {paperSize.toUpperCase()} · Margin: {pageMargin}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setMode('po')}
          style={{
            background: mode === 'po' ? '#0284c7' : 'rgba(255,255,255,0.12)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            padding: '7px 12px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          📋 PO Invoice
        </button>
        <button
          type="button"
          onClick={() => setMode('chalan')}
          style={{
            background: mode === 'chalan' ? '#0284c7' : 'rgba(255,255,255,0.12)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            padding: '7px 12px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          🚚 Chalan
        </button>

        {/* Print */}
        <button
          type="button"
          onClick={handlePrint}
          disabled={shareLoading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            background: '#0284c7',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: shareLoading ? 'not-allowed' : 'pointer',
          }}
        >
          <span>🖨️</span> Print
        </button>

        {/* Consolidated Share / Export Button */}
        <button
          type="button"
          onClick={() => setShowShareModal(true)}
          disabled={shareLoading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            background: '#16a34a',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: shareLoading ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 6px rgba(22,163,74,0.3)',
          }}
          title="Share or Export Purchase Order as PDF or JPG"
        >
          <span>📤</span> Share / Export
        </button>

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          disabled={shareLoading}
          style={{
            padding: '7px 14px',
            background: 'rgba(255,255,255,0.15)',
            color: '#ffffff',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          ✕ Close
        </button>
      </div>
    </div>
  );
}
