import React from 'react';

export default function OfferInputCard({
  icon,
  title,
  enabled,
  onToggle,
  value,
  onChange,
  placeholder,
}) {
  return (
    <div
      style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '12px 14px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}
      >
        <label
          style={{
            fontSize: '0.82rem',
            fontWeight: 800,
            color: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>{icon}</span>
          <span>{title}</span>
        </label>
        <label
          style={{
            fontSize: '0.74rem',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
            fontWeight: 700,
            color: enabled ? '#15803d' : '#64748b',
          }}
        >
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          <span>{enabled ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Off)'}</span>
        </label>
      </div>
      <textarea
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '8px 10px',
          borderRadius: '6px',
          border: '1px solid #cbd5e1',
          fontSize: '0.82rem',
          color: '#0f172a',
          boxSizing: 'border-box',
          outline: 'none',
          fontFamily: 'inherit',
        }}
      />
    </div>
  );
}
