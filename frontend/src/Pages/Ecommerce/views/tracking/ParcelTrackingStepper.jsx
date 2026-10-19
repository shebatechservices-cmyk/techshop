import React from 'react';

export default function ParcelTrackingStepper({ ord, status }) {
  const steps = [
    { key: 'placed', label: 'Order Placed', desc: new Date(ord.created_at).toLocaleDateString() },
    { key: 'confirmed', label: 'Confirmed', desc: 'Verified by Sheba Tech' },
    { key: 'processing', label: 'Packed', desc: 'Ready for Courier' },
    { key: 'shipped', label: 'With Courier', desc: ord.courier_name || 'In Transit' },
    { key: 'delivered', label: 'Delivered', desc: 'Handed over' },
  ];

  let currentIdx = 0;
  if (status === 'processing') currentIdx = 2;
  else if (status === 'shipped') currentIdx = 3;
  else if (status === 'delivered') currentIdx = 4;
  else currentIdx = 1;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        position: 'relative',
        marginBottom: '24px',
      }}
    >
      {steps.map((st, sIdx) => {
        const isDone = currentIdx >= sIdx;
        return (
          <div key={st.key} style={{ flex: 1, textAlign: 'center' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: isDone ? '#0d9488' : '#e2e8f0',
                color: isDone ? '#ffffff' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 6px auto',
                fontWeight: 800,
                fontSize: '0.82rem',
              }}
            >
              {isDone ? '✓' : sIdx + 1}
            </div>
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: isDone ? '#0f172a' : '#94a3b8',
              }}
            >
              {st.label}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
              {st.desc}
            </div>
          </div>
        );
      })}
    </div>
  );
}
