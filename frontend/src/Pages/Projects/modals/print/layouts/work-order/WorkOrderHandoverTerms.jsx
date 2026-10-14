import React from 'react';

export default function WorkOrderHandoverTerms() {
  return (
    <div
      style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '5px',
        padding: '6px 10px',
        marginBottom: '14px',
      }}
    >
      <div
        style={{
          fontSize: '0.68rem',
          fontWeight: 800,
          color: '#475569',
          textTransform: 'uppercase',
          marginBottom: '2px',
        }}
      >
        Service Handover & Warranty Terms:
      </div>
      <div
        style={{
          fontSize: '0.68rem',
          color: '#64748b',
          lineHeight: '1.35',
        }}
      >
        1. All equipment inspected, configured, and demonstrated in fully functional state with live viewing.<br />
        2. Warranty terms apply as stated in the primary invoice; electrical surge, lightning, or burn damages are void.<br />
        3. Customer acknowledges complete receipt of materials and satisfactory completion of technical work.
      </div>
    </div>
  );
}
