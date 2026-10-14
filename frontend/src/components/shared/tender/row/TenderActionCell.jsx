import React from 'react';

export default function TenderActionCell({
  isLocked,
  index,
  onAccept,
  onCancel,
}) {
  return (
    <td style={{ padding: '4px 6px', width: '70px', textAlign: 'center' }}>
      {isLocked ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '22px',
              height: '22px',
              background: '#dcfce7',
              color: '#15803d',
              borderRadius: '4px',
              fontSize: '0.72rem',
              fontWeight: 800,
            }}
            title="Payment Accepted"
          >
            ✓
          </span>
          <button
            type="button"
            onClick={() => onCancel(index)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '22px',
              height: '22px',
              borderRadius: '4px',
              border: '1px solid #fecaca',
              background: '#fff1f2',
              color: '#dc2626',
              fontSize: '0.74rem',
              fontWeight: 800,
              cursor: 'pointer',
            }}
            title="Remove this payment entry"
          >
            ✕
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
        >
          <button
            type="button"
            onClick={() => onAccept(index)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              border: 'none',
              background: '#16a34a',
              color: '#ffffff',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(22, 163, 74, 0.25)',
            }}
            title="Accept / Confirm payment"
          >
            ✓
          </button>
          <button
            type="button"
            onClick={() => onCancel(index)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              color: '#64748b',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
            title="Cancel / Remove row"
          >
            ✕
          </button>
        </div>
      )}
    </td>
  );
}
