import React from 'react';

export default function LedgerActionFooter({
  order = null,
  copySuccess = false,
  onLoadInForm = null,
  onOpenInPurchaseForm = null,
  onOpenPrint = null,
  setIsInternalPrintOpen = () => {},
  handleShareWhatsApp = () => {},
  handleCopySummary = () => {},
  onClose = () => {},
}) {
  return (
    <div
      style={{
        padding: '14px 24px',
        borderTop: '1px solid #e2e8f0',
        background: '#ffffff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px',
      }}
    >
      <div style={{ display: 'flex', gap: '8px' }}>
        {/* Open / Load in Form Button */}
        <button
          type="button"
          onClick={() => {
            const handler = onLoadInForm || onOpenInPurchaseForm;
            if (handler && order) {
              handler(order);
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            background: '#3b82f6',
            color: '#ffffff',
            border: 'none',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
          title="Load this order's items and details into the Purchase Order form"
        >
          📝 Open in Purchase Form
        </button>

        {/* Print Button */}
        <button
          type="button"
          onClick={() => {
            if (onOpenPrint && order) {
              onOpenPrint(order);
            } else if (order) {
              setIsInternalPrintOpen(true);
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            background: '#f8fafc',
            color: '#334155',
            border: '1px solid #cbd5e1',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          🖨️ Print Invoice
        </button>

        {/* WhatsApp Share */}
        <button
          type="button"
          onClick={handleShareWhatsApp}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            background: '#25d366',
            color: '#ffffff',
            border: 'none',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          📲 WhatsApp
        </button>

        {/* Copy Summary */}
        <button
          type="button"
          onClick={handleCopySummary}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            background: '#f1f5f9',
            color: '#475569',
            border: '1px solid #cbd5e1',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {copySuccess ? '✓ Copied' : '📋 Copy'}
        </button>
      </div>

      <button
        type="button"
        onClick={onClose}
        style={{
          padding: '8px 16px',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          background: '#ffffff',
          color: '#475569',
          fontWeight: 600,
          fontSize: '0.85rem',
          cursor: 'pointer',
        }}
      >
        Close
      </button>
    </div>
  );
}
