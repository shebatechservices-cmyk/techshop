import React from 'react';

export default function PurchaseDeleteBlockedModal({ deleteBlockedDialog, onClose }) {
  if (!deleteBlockedDialog?.isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px',
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        maxWidth: '520px',
        width: '100%',
        padding: '24px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
        border: '1px solid #fee2e2',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: '#fef2f2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            color: '#ef4444',
            flexShrink: 0,
          }}>
            ⚠️
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#991b1b' }}>
              Cannot Delete Purchase #{deleteBlockedDialog.poNumber}
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Referential Integrity Lock Active
            </p>
          </div>
        </div>

        <div style={{
          backgroundColor: '#fff1f2',
          borderRadius: '10px',
          padding: '14px',
          border: '1px solid #fecdd3',
          marginBottom: '16px',
          fontSize: '0.9rem',
          color: '#9f1239',
          lineHeight: 1.5,
        }}>
          {deleteBlockedDialog.message}
        </div>

        {deleteBlockedDialog.linkedInvoices && deleteBlockedDialog.linkedInvoices.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
              Attached Sales Invoices to Delete / Rollback First:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {deleteBlockedDialog.linkedInvoices.map((inv) => (
                <span
                  key={inv}
                  style={{
                    backgroundColor: '#f1f5f9',
                    color: '#0f172a',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                  }}
                >
                  📄 {inv}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 18px',
              backgroundColor: '#334155',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
            }}
          >
            Understood / Close
          </button>
        </div>
      </div>
    </div>
  );
}
