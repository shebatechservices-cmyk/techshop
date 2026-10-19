import React from 'react';

const layoutButtons = [
  { key: 'a4_jobcard', icon: '📄', label: 'A4 Technical Job Card' },
  { key: 'a4_customer', icon: '📋', label: 'Customer Handover Copy' },
  { key: 'pos_thermal', icon: '🧾', label: '80mm Thermal Slip' },
];

export default function ProjectPrintToolbar({ project, layout, setLayout, onPrint, onClose }) {
  return (
    <div
      className="no-print"
      style={{
        padding: '12px 18px',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        borderBottom: '1px solid #334155',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '1.3rem' }}>🖨️</span>
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: '1.05rem',
              fontWeight: 800,
              color: '#f8fafc',
              letterSpacing: '-0.01em',
            }}
          >
            Print Work Order & Job Card
          </h3>
          <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8' }}>
            Job: <strong style={{ color: '#38bdf8' }}>{project.project_code}</strong> •{' '}
            {project.customer_name}
          </p>
        </div>
      </div>

      {/* LAYOUT SWITCHER */}
      <div
        style={{
          display: 'flex',
          background: '#334155',
          padding: '3px',
          borderRadius: '8px',
          gap: '3px',
        }}
      >
        {layoutButtons.map((btn) => (
          <button
            key={btn.key}
            type="button"
            onClick={() => setLayout(btn.key)}
            style={{
              background: layout === btn.key ? '#2563eb' : 'transparent',
              color: '#ffffff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <span>{btn.icon}</span>
            <span>{btn.label}</span>
          </button>
        ))}
      </div>

      {/* ACTIONS */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={onPrint}
          style={{
            padding: '7px 18px',
            background: '#16a34a',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 6px rgba(22, 163, 74, 0.4)',
          }}
        >
          <span>🖨️</span>
          <span>Print Sheet</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: '7px 14px',
            background: '#475569',
            color: '#f8fafc',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: 'pointer',
          }}
        >
          ✕ Close
        </button>
      </div>
    </div>
  );
}
