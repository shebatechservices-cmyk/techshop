import React from 'react';

export default function WorkOrderSignaturesFooter({
  project = {},
  printDateStr,
  shop = {},
}) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          paddingTop: '10px',
        }}
      >
        <div style={{ textAlign: 'center', width: '180px' }}>
          <div
            style={{
              borderTop: '1.5px solid #0f172a',
              paddingTop: '4px',
              fontSize: '0.75rem',
              fontWeight: 800,
              color: '#0f172a',
            }}
          >
            Customer Acceptance
          </div>
          <div style={{ fontSize: '0.67rem', color: '#64748b' }}>
            Received & satisfied with service
          </div>
        </div>

        <div style={{ textAlign: 'center', width: '180px' }}>
          <div
            style={{
              borderTop: '1.5px solid #0f172a',
              paddingTop: '4px',
              fontSize: '0.75rem',
              fontWeight: 800,
              color: '#0f172a',
            }}
          >
            Lead Technician
          </div>
          <div style={{ fontSize: '0.67rem', color: '#64748b' }}>
            {project.technician_name}
          </div>
        </div>

        <div style={{ textAlign: 'center', width: '180px' }}>
          <div
            style={{
              borderTop: '1.5px solid #0f172a',
              paddingTop: '4px',
              fontSize: '0.75rem',
              fontWeight: 800,
              color: '#0f172a',
            }}
          >
            Authorized Signatory
          </div>
          <div style={{ fontSize: '0.67rem', color: '#64748b' }}>
            Sheba Technology & Networking
          </div>
        </div>
      </div>

      <div
        style={{
          textAlign: 'center',
          marginTop: '12px',
          fontSize: '0.65rem',
          color: '#94a3b8',
          borderTop: '1px solid #f1f5f9',
          paddingTop: '4px',
        }}
      >
        Printed on: {printDateStr} &nbsp;•&nbsp; Sheba POS & ERP Solutions &nbsp;•&nbsp; Support: {shop.phone}
      </div>
    </div>
  );
}
