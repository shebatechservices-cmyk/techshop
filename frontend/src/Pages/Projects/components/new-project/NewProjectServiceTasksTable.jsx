import React from 'react';
import { SERVICE_PRESETS } from '../../utils/projectHelpers';

export default function NewProjectServiceTasksTable({
  services = [],
  totalSetupFee = 0,
  onAddServiceRow,
  onUpdateServiceRow,
  onRemoveServiceRow
}) {
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', display: 'block' }}>
            💼 Dynamic Service Tasks & Remuneration
          </span>
          <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
            Add multiple tasks (e.g. CCTV, Router, ONU, TV setup). Setup fee is dynamically summed.
          </span>
        </div>
        <button
          type="button"
          onClick={() => onAddServiceRow('', 500)}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #0284c7',
            background: '#0284c7',
            color: '#fff',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <span>+</span> Add Service Row
        </button>
      </div>

      {/* Quick Presets Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px', alignItems: 'center' }}>
        <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Quick Presets:</span>
        {SERVICE_PRESETS.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onAddServiceRow(preset.name, preset.rate)}
            style={{
              background: '#e0f2fe',
              border: '1px solid #bae6fd',
              color: '#0369a1',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            + {preset.name} (৳{preset.rate})
          </button>
        ))}
      </div>

      {/* Dynamic Service Rows Table */}
      <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1', overflow: 'hidden', marginBottom: '12px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#475569', textAlign: 'left' }}>
              <th style={{ padding: '8px 10px', width: '45%' }}>Service / Task Name</th>
              <th style={{ padding: '8px 10px', width: '15%' }}>Qty</th>
              <th style={{ padding: '8px 10px', width: '20%' }}>Unit Rate (৳)</th>
              <th style={{ padding: '8px 10px', width: '15%' }}>Total (৳)</th>
              <th style={{ padding: '8px 10px', width: '5%', textAlign: 'center' }}></th>
            </tr>
          </thead>
          <tbody>
            {services.map((s, idx) => (
              <tr key={s.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '6px 10px' }}>
                  <input
                    type="text"
                    placeholder="e.g. Router Setup / CCTV Installation"
                    value={s.service_name}
                    onChange={(e) => onUpdateServiceRow(s.id, 'service_name', e.target.value)}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </td>
                <td style={{ padding: '6px 10px' }}>
                  <input
                    type="number"
                    min="1"
                    value={s.quantity}
                    onChange={(e) => onUpdateServiceRow(s.id, 'quantity', e.target.value)}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </td>
                <td style={{ padding: '6px 10px' }}>
                  <input
                    type="number"
                    min="0"
                    placeholder="Rate"
                    value={s.unit_rate}
                    onChange={(e) => onUpdateServiceRow(s.id, 'unit_rate', e.target.value)}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </td>
                <td style={{ padding: '6px 10px', fontWeight: 700, color: '#0284c7' }}>
                  ৳ {((parseFloat(s.quantity) || 0) * (parseFloat(s.unit_rate) || 0)).toLocaleString('en-BD')}
                </td>
                <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => onRemoveServiceRow(s.id)}
                    title="Remove Row"
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem', padding: '2px 4px' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#f8fafc', borderTop: '1px solid #cbd5e1', fontWeight: 700 }}>
              <td colSpan={3} style={{ padding: '8px 10px', textAlign: 'right', color: '#334155' }}>
                Total Setup Fee (Sum of Services):
              </td>
              <td colSpan={2} style={{ padding: '8px 10px', color: '#0284c7', fontSize: '0.9rem' }}>
                ৳ {totalSetupFee.toLocaleString('en-BD')}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
