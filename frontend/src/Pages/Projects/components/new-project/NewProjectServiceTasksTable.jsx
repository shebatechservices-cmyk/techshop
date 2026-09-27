import React, { useState } from 'react';
import { SERVICE_PRESETS } from '../../utils/projectHelpers';

export default function NewProjectServiceTasksTable({
  services = [],
  servicePresets = [],
  totalSetupFee = 0,
  onAddServiceRow,
  onUpdateServiceRow,
  onApplyPresetToRow,
  onRemoveServiceRow,
  onOpenManagePresets
}) {
  const [activeDropdownRowId, setActiveDropdownRowId] = useState(null);

  const activePresets = (servicePresets && servicePresets.length > 0)
    ? servicePresets.map(p => ({ name: p.name, rate: p.default_rate }))
    : SERVICE_PRESETS;

  const handleSelectPreset = (rowId, preset) => {
    if (onApplyPresetToRow) {
      onApplyPresetToRow(rowId, preset.name, preset.rate);
    } else {
      onUpdateServiceRow(rowId, 'service_name', preset.name);
      onUpdateServiceRow(rowId, 'unit_rate', preset.rate);
    }
    setActiveDropdownRowId(null);
  };

  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
      {/* Section Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', display: 'block' }}>
            💼 Dynamic Service Tasks & Remuneration
          </span>
          <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
            Add multiple tasks (e.g. CCTV, Router, ONU, TV setup). Setup fee is dynamically summed.
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {onOpenManagePresets && (
            <button
              type="button"
              onClick={onOpenManagePresets}
              title="Manage Service Task Presets & Rates"
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#fff',
                color: '#334155',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>⚙️</span> Presets
            </button>
          )}
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
      </div>

      {/* Dynamic Service Rows Table */}
      <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1', overflow: 'visible', marginBottom: '12px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#475569', textAlign: 'left' }}>
              <th style={{ padding: '8px 10px', width: '45%' }}>Service / Task Name</th>
              <th style={{ padding: '8px 10px', width: '14%' }}>Qty</th>
              <th style={{ padding: '8px 10px', width: '18%' }}>Unit Rate (৳)</th>
              <th style={{ padding: '8px 10px', width: '15%' }}>Total (৳)</th>
              <th style={{ padding: '8px 10px', width: '8%', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s, idx) => {
              const isDropdownOpen = activeDropdownRowId === s.id;
              return (
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', position: 'relative' }}>
                      {/* Dropdown trigger button */}
                      <div style={{ position: 'relative' }}>
                        <button
                          type="button"
                          onClick={() => setActiveDropdownRowId(isDropdownOpen ? null : s.id)}
                          title="Apply Quick Service Preset"
                          style={{
                            background: isDropdownOpen ? '#0284c7' : '#e0f2fe',
                            borderColor: isDropdownOpen ? '#0284c7' : '#bae6fd',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            color: isDropdownOpen ? '#ffffff' : '#0369a1',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            width: '26px',
                            height: '26px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0,
                            transition: 'all 0.15s ease'
                          }}
                        >
                          +
                        </button>

                        {/* Presets Dropdown Menu */}
                        {isDropdownOpen && (
                          <>
                            <div
                              style={{ position: 'fixed', inset: 0, zIndex: 999 }}
                              onClick={() => setActiveDropdownRowId(null)}
                            />
                            <div
                              style={{
                                position: 'absolute',
                                right: 0,
                                top: '100%',
                                marginTop: '4px',
                                background: '#ffffff',
                                border: '1px solid #cbd5e1',
                                borderRadius: '8px',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                                zIndex: 1000,
                                minWidth: '240px',
                                textAlign: 'left',
                                padding: '4px 0',
                                maxHeight: '280px',
                                overflowY: 'auto'
                              }}
                            >
                              <div style={{ padding: '6px 12px', fontSize: '0.72rem', fontWeight: 800, color: '#475569', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Apply Service Preset:
                              </div>
                              {activePresets.length === 0 ? (
                                <div style={{ padding: '8px 12px', fontSize: '0.76rem', color: '#94a3b8' }}>
                                  No presets configured.
                                </div>
                              ) : (
                                activePresets.map((preset, pIdx) => (
                                  <button
                                    key={pIdx}
                                    type="button"
                                    onClick={() => handleSelectPreset(s.id, preset)}
                                    style={{
                                      width: '100%',
                                      textAlign: 'left',
                                      background: 'none',
                                      border: 'none',
                                      padding: '7px 12px',
                                      fontSize: '0.78rem',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      color: '#1e293b',
                                      borderBottom: '1px solid #f8fafc'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f9ff'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                                  >
                                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{preset.name}</span>
                                    <span style={{ color: '#0284c7', fontWeight: 800, fontSize: '0.75rem', background: '#e0f2fe', padding: '1px 6px', borderRadius: '4px', marginLeft: '8px' }}>
                                      ৳{Number(preset.rate || 0).toLocaleString('en-BD')}
                                    </span>
                                  </button>
                                ))
                              )}
                              {onOpenManagePresets && (
                                <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '4px', paddingTop: '4px', background: '#f8fafc' }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveDropdownRowId(null);
                                      onOpenManagePresets();
                                    }}
                                    style={{
                                      width: '100%',
                                      textAlign: 'left',
                                      background: 'none',
                                      border: 'none',
                                      padding: '6px 12px',
                                      fontSize: '0.74rem',
                                      color: '#0284c7',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '5px'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#e0f2fe'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                                  >
                                    <span>⚙️</span> Manage Presets & Rates...
                                  </button>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => onRemoveServiceRow(s.id)}
                        title="Remove Row"
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.95rem', padding: '2px 4px' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
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
