import React from 'react';

export default function InvoiceToolbar({
  isQuotation,
  isChalan,
  docNumber,
  paperSize,
  pageMargin,
  mode,
  setMode,
  handlePrint,
  shareLoading,
  setShowShareModal,
  onClose,
}) {
  return (
    <div
      className="no-print"
      style={{
        width: '100%',
        maxWidth: paperSize === 'thermal_80mm' ? '380px' : (paperSize === 'a5' ? '600px' : '850px'),
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#1e293b',
        color: '#ffffff',
        padding: '10px 16px',
        borderRadius: '10px 10px 0 0',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '1.1rem' }}>{isQuotation ? '📋' : '🧾'}</span>
        <div>
          <strong style={{ fontSize: '0.92rem', display: 'block' }}>
            {isQuotation ? 'Sales Quotation Preview' : (isChalan ? 'Delivery Challan Preview' : 'Sales Invoice Receipt')}
          </strong>
          <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
            {docNumber} · {paperSize.toUpperCase()} · Margin: {pageMargin}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {!isQuotation && (
          <>
            <button
              type="button"
              onClick={() => setMode('invoice')}
              style={{
                background: mode === 'invoice' ? '#0284c7' : 'rgba(255,255,255,0.12)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🧾 Invoice
            </button>
            <button
              type="button"
              onClick={() => setMode('chalan')}
              style={{
                background: mode === 'chalan' ? '#0284c7' : 'rgba(255,255,255,0.12)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🚚 Chalan
            </button>
          </>
        )}

        <button
          type="button"
          onClick={handlePrint}
          disabled={shareLoading}
          style={{
            background: '#0284c7',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 14px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: shareLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 6px rgba(2,132,199,0.3)',
          }}
        >
          🖨️ Print
        </button>

        <button
          type="button"
          onClick={() => setShowShareModal(true)}
          disabled={shareLoading}
          style={{
            background: '#16a34a',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 14px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: shareLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 6px rgba(22,163,74,0.3)',
          }}
          title="Share or Export Invoice as PDF or JPG"
        >
          📤 Share / Export
        </button>

        <button
          type="button"
          onClick={onClose}
          disabled={shareLoading}
          style={{
            background: 'rgba(255,255,255,0.15)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            marginLeft: '4px',
          }}
        >
          ✕ Close
        </button>
      </div>
    </div>
  );
}
