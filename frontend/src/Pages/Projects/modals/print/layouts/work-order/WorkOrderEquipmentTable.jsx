import React from 'react';

export default function WorkOrderEquipmentTable({ equipmentList = [] }) {
  if (!equipmentList || equipmentList.length === 0) return null;

  return (
    <div style={{ marginBottom: '12px' }}>
      <div
        style={{
          fontSize: '0.74rem',
          fontWeight: 800,
          color: '#0f172a',
          textTransform: 'uppercase',
          marginBottom: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
        }}
      >
        <span>📋</span>
        <span>Installation Equipment & Device Checklist</span>
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
            <th style={{ padding: '5px 8px', textAlign: 'left' }}>
              Product / Device Description
            </th>
            <th style={{ padding: '5px 8px', textAlign: 'center', width: '75px' }}>
              Quantity
            </th>
            <th style={{ padding: '5px 8px', textAlign: 'center', width: '140px' }}>
              Installation Verification
            </th>
          </tr>
        </thead>
        <tbody>
          {equipmentList.map((eq, i) => (
            <tr
              key={i}
              style={{
                borderBottom: '1px solid #e2e8f0',
                background: i % 2 === 0 ? '#ffffff' : '#f8fafc',
              }}
            >
              <td
                style={{
                  padding: '4px 8px',
                  textAlign: 'center',
                  color: '#64748b',
                  fontWeight: 600,
                }}
              >
                {i + 1}
              </td>
              <td style={{ padding: '4px 8px', fontWeight: 700, color: '#1e293b' }}>
                {eq.product_name}
              </td>
              <td
                style={{
                  padding: '4px 8px',
                  textAlign: 'center',
                  fontWeight: 800,
                  color: '#0f172a',
                }}
              >
                {eq.quantity} pcs
              </td>
              <td
                style={{
                  padding: '4px 8px',
                  textAlign: 'center',
                  color: '#1e40af',
                  fontWeight: 600,
                  fontSize: '0.74rem',
                }}
              >
                [&nbsp;✓&nbsp;] Installed & Tested
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
