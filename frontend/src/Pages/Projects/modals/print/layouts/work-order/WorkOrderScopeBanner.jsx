import React from 'react';

export default function WorkOrderScopeBanner({ project = {} }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#f8fafc',
        border: '1px solid #cbd5e1',
        borderLeft: '4px solid #2563eb',
        borderRadius: '6px',
        padding: '8px 12px',
        marginBottom: '12px',
      }}
    >
      <div>
        <div
          style={{
            fontSize: '0.68rem',
            color: '#64748b',
            textTransform: 'uppercase',
            fontWeight: 800,
            letterSpacing: '0.03em',
          }}
        >
          Work Order Title & Scope
        </div>
        <div
          style={{
            fontSize: '0.98rem',
            fontWeight: 800,
            color: '#0f172a',
            marginTop: '1px',
          }}
        >
          {project.title}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <span
          style={{
            padding: '4px 9px',
            borderRadius: '5px',
            fontSize: '0.73rem',
            fontWeight: 800,
            background: project.invoice_no ? '#eff6ff' : '#fef3c7',
            color: project.invoice_no ? '#1e40af' : '#92400e',
            border: project.invoice_no
              ? '1px solid #bfdbfe'
              : '1px solid #fde68a',
          }}
        >
          {project.invoice_no
            ? `📦 Invoice Linked: #${project.invoice_no}`
            : '🔧 Direct Service & Maintenance'}
        </span>
      </div>
    </div>
  );
}
