import React from 'react';

export default function WorkOrderPartyDetails({ project = {}, startDateStr }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginBottom: '12px',
      }}
    >
      {/* Client & Site */}
      <div
        style={{
          border: '1px solid #cbd5e1',
          borderRadius: '6px',
          overflow: 'hidden',
          background: '#ffffff',
        }}
      >
        <div
          style={{
            background: '#f1f5f9',
            padding: '5px 10px',
            fontSize: '0.74rem',
            fontWeight: 800,
            color: '#0f172a',
            textTransform: 'uppercase',
            borderBottom: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <span>👤</span>
          <span>Customer & Site Details</span>
        </div>
        <div
          style={{
            padding: '8px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            fontSize: '0.78rem',
          }}
        >
          <div style={{ display: 'flex' }}>
            <span style={{ width: '105px', color: '#64748b' }}>Customer Name:</span>
            <strong style={{ color: '#0f172a' }}>{project.customer_name}</strong>
          </div>
          <div style={{ display: 'flex' }}>
            <span style={{ width: '105px', color: '#64748b' }}>Contact Phone:</span>
            <strong style={{ color: '#16a34a' }}>
              {project.site_phone || project.customer_phone || 'N/A'}
            </strong>
          </div>
          <div style={{ display: 'flex' }}>
            <span style={{ width: '105px', color: '#64748b' }}>Site Location:</span>
            <span style={{ color: '#0f172a', fontWeight: 600 }}>
              {project.site_address || 'On-site'}
            </span>
          </div>
          <div style={{ display: 'flex' }}>
            <span style={{ width: '105px', color: '#64748b' }}>Service Scope:</span>
            <span style={{ color: '#1e40af', fontWeight: 700 }}>
              {project.project_type || 'CCTV Installation'}
            </span>
          </div>
        </div>
      </div>

      {/* Assigned Technician & Schedule */}
      <div
        style={{
          border: '1px solid #cbd5e1',
          borderRadius: '6px',
          overflow: 'hidden',
          background: '#ffffff',
        }}
      >
        <div
          style={{
            background: '#f1f5f9',
            padding: '5px 10px',
            fontSize: '0.74rem',
            fontWeight: 800,
            color: '#0f172a',
            textTransform: 'uppercase',
            borderBottom: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <span>👷</span>
          <span>Assigned Technician & Schedule</span>
        </div>
        <div
          style={{
            padding: '8px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            fontSize: '0.78rem',
          }}
        >
          <div style={{ display: 'flex' }}>
            <span style={{ width: '115px', color: '#64748b' }}>Lead Technician:</span>
            <strong style={{ color: '#0f172a' }}>{project.technician_name}</strong>
          </div>
          <div style={{ display: 'flex' }}>
            <span style={{ width: '115px', color: '#64748b' }}>Tech Contact:</span>
            <strong style={{ color: '#0f172a' }}>
              {project.technician_contact || 'N/A'}
            </strong>
          </div>
          <div style={{ display: 'flex' }}>
            <span style={{ width: '115px', color: '#64748b' }}>Scheduled Date:</span>
            <span style={{ color: '#0f172a', fontWeight: 600 }}>{startDateStr}</span>
          </div>
          <div style={{ display: 'flex' }}>
            <span style={{ width: '115px', color: '#64748b' }}>Order Status:</span>
            <strong
              style={{
                color: project.status === 'completed' ? '#16a34a' : '#2563eb',
                textTransform: 'capitalize',
              }}
            >
              {project.status === 'completed'
                ? '✓ Completed'
                : project.status?.replace('_', ' ') || 'Assigned'}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
