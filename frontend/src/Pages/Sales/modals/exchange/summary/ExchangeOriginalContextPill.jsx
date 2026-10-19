import React from 'react';

export default function ExchangeOriginalContextPill({
  originalSale,
  origTotal = 0,
  origPaid = 0,
  origDue = 0,
  dueCleared = 0,
  taka,
}) {
  if (!originalSale) return null;

  return (
    <div
      style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '10px 14px',
        marginBottom: '14px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '0.78rem' }}>
          <span style={{ color: '#64748b' }}>মূল বিল: </span>
          <strong style={{ color: '#0f172a' }}>{taka(origTotal)}</strong>
        </div>
        <div style={{ fontSize: '0.78rem' }}>
          <span style={{ color: '#64748b' }}>পূর্বে জমা ছিল: </span>
          <strong style={{ color: '#059669' }}>{taka(origPaid)}</strong>
        </div>
        <div style={{ fontSize: '0.78rem' }}>
          <span style={{ color: '#64748b' }}>পূর্বের বাকি (Due): </span>
          <strong style={{ color: origDue > 0 ? '#dc2626' : '#64748b' }}>
            {taka(origDue)}
          </strong>
        </div>
      </div>

      {dueCleared > 0 && (
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#065f46',
            background: '#d1fae5',
            padding: '3px 8px',
            borderRadius: '6px',
            border: '1px solid #6ee7b7',
          }}
        >
          ✓ পূর্বের বকেয়া থেকে {taka(dueCleared)} স্বয়ংক্রিয়ভাবে সমন্বয় (পরিশোধ) হচ্ছে
        </div>
      )}
    </div>
  );
}
