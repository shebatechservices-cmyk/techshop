import React from 'react';

export default function QuotationFooterActions({
  onOpenPrintPreview,
  onClose,
  saving,
  editingQuotation,
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
        marginTop: '22px',
        borderTop: '1px solid #f1f5f9',
        paddingTop: '16px',
      }}
    >
      <button
        type="button"
        onClick={onOpenPrintPreview}
        style={{
          padding: '9px 18px',
          borderRadius: '8px',
          border: '1.5px solid #4f46e5',
          background: '#eef2ff',
          color: '#4f46e5',
          fontSize: '0.88rem',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        🖨️ Print Preview
      </button>
      <button
        type="button"
        onClick={onClose}
        style={{
          padding: '9px 18px',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          background: '#ffffff',
          color: '#475569',
          fontSize: '0.88rem',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={saving}
        style={{
          padding: '9px 24px',
          borderRadius: '8px',
          border: 'none',
          background: '#4f46e5',
          color: '#ffffff',
          fontSize: '0.88rem',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)',
        }}
      >
        {saving ? 'Saving...' : editingQuotation && editingQuotation.id ? '✓ Update Quotation' : '✓ Save Quotation'}
      </button>
    </div>
  );
}
