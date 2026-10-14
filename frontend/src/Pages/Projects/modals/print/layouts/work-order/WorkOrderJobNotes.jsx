import React from 'react';

export default function WorkOrderJobNotes({ description }) {
  if (!description) return null;

  return (
    <div
      style={{
        marginBottom: '10px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '5px',
        padding: '6px 10px',
      }}
    >
      <div
        style={{
          fontSize: '0.68rem',
          fontWeight: 800,
          color: '#64748b',
          textTransform: 'uppercase',
        }}
      >
        Job Instructions & Technical Notes:
      </div>
      <div
        style={{
          fontSize: '0.76rem',
          color: '#1e293b',
          marginTop: '2px',
          whiteSpace: 'pre-line',
        }}
      >
        {description}
      </div>
    </div>
  );
}
