import React from 'react';

export default function WorkOrderServicesTable({
  servicesList = [],
  equipmentList = [],
}) {
  if (!servicesList || servicesList.length === 0 || (equipmentList && equipmentList.length > 0)) {
    return null;
  }

  return (
    <div style={{ marginBottom: '12px' }}>
      <div
        style={{
          fontSize: '0.74rem',
          fontWeight: 800,
          color: '#0f172a',
          textTransform: 'uppercase',
          marginBottom: '4px',
        }}
      >
        📋 Service Tasks Breakdown
      </div>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.77rem',
          border: '1px solid #cbd5e1',
        }}
      >
        <thead>
          <tr style={{ background: '#0f172a', color: '#ffffff' }}>
            <th style={{ padding: '5px 8px', textAlign: 'center', width: '35px' }}>#</th>
            <th style={{ padding: '5px 8px', textAlign: 'left' }}>Service Description</th>
            <th style={{ padding: '5px 8px', textAlign: 'center', width: '60px' }}>Qty</th>
            <th style={{ padding: '5px 8px', textAlign: 'right', width: '90px' }}>Rate</th>
            <th style={{ padding: '5px 8px', textAlign: 'right', width: '90px' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {servicesList.map((srv, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td
                style={{
                  padding: '4px 8px',
                  textAlign: 'center',
                  color: '#64748b',
                }}
              >
                {i + 1}
              </td>
              <td style={{ padding: '4px 8px', fontWeight: 700 }}>{srv.service_name}</td>
              <td style={{ padding: '4px 8px', textAlign: 'center' }}>{srv.quantity}</td>
              <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                ৳ {Number(srv.unit_rate || 0).toLocaleString('en-IN')}
              </td>
              <td
                style={{
                  padding: '4px 8px',
                  textAlign: 'right',
                  fontWeight: 700,
                }}
              >
                ৳ {Number(srv.line_total || 0).toLocaleString('en-IN')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
