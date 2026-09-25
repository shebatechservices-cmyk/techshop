import React from 'react';

export default function WarehouseTable({
  loading,
  warehouses,
  onSetDefault,
  onEdit,
  onDelete,
}) {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <th style={{ padding: '8px 12px' }}>Warehouse Name & Code</th>
            <th style={{ padding: '8px 12px' }}>Location / Address</th>
            <th style={{ padding: '8px 12px' }}>Contact Person</th>
            <th style={{ padding: '8px 12px', textAlign: 'center' }}>Stock Status</th>
            <th style={{ padding: '8px 12px', textAlign: 'center' }}>Status</th>
            <th style={{ padding: '8px 12px', textAlign: 'center', width: '120px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>🔄</div>
                Loading warehouses...
              </td>
            </tr>
          ) : warehouses.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                No warehouses found matching your query.
              </td>
            </tr>
          ) : (
            warehouses.map((wh) => (
              <tr
                key={wh.id}
                style={{
                  borderBottom: '1px solid #f1f5f9',
                  background: wh.is_default ? '#f0f9ff' : '#ffffff',
                }}
              >
                {/* Name & Code */}
                <td style={{ padding: '8px 12px', verticalAlign: 'middle' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.84rem' }}>
                      {wh.name}
                    </span>
                    {wh.is_default && (
                      <span
                        style={{
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          background: '#fef3c7',
                          color: '#b45309',
                          border: '1px solid #fde68a',
                          padding: '1px 5px',
                          borderRadius: '4px',
                        }}
                      >
                        ★ DEFAULT
                      </span>
                    )}
                  </div>
                  {wh.code && (
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '0.68rem',
                        color: '#0369a1',
                        background: '#e0f2fe',
                        padding: '1px 4px',
                        borderRadius: '3px',
                        display: 'inline-block',
                        marginTop: '2px',
                      }}
                    >
                      {wh.code}
                    </span>
                  )}
                </td>

                {/* Location / Address */}
                <td style={{ padding: '8px 12px', verticalAlign: 'middle', color: '#334155' }}>
                  <div style={{ fontWeight: 600 }}>{wh.location || '—'}</div>
                  {wh.address && (
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '1px' }}>
                      {wh.address}
                    </div>
                  )}
                </td>

                {/* Contact */}
                <td style={{ padding: '8px 12px', verticalAlign: 'middle', color: '#334155' }}>
                  <div style={{ fontWeight: 600 }}>{wh.contact_person || '—'}</div>
                  {wh.phone && (
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
                      📞 {wh.phone}
                    </div>
                  )}
                </td>

                {/* Stock Summary */}
                <td style={{ padding: '8px 12px', textAlign: 'center', verticalAlign: 'middle' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: '#f1f5f9',
                      color: '#475569',
                      display: 'inline-block',
                    }}
                  >
                    {Number(wh.total_stock_units || 0).toLocaleString()} units
                  </span>
                </td>

                {/* Status */}
                <td style={{ padding: '8px 12px', textAlign: 'center', verticalAlign: 'middle' }}>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '999px',
                      background: wh.is_active ? '#dcfce7' : '#f1f5f9',
                      color: wh.is_active ? '#15803d' : '#94a3b8',
                      border: `1px solid ${wh.is_active ? '#bbf7d0' : '#e2e8f0'}`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                    }}
                  >
                    <span>{wh.is_active ? '🟢' : '⚪'}</span>
                    <span>{wh.is_active ? 'Active' : 'Inactive'}</span>
                  </span>
                </td>

                {/* Actions */}
                <td style={{ padding: '8px 12px', textAlign: 'center', verticalAlign: 'middle' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    {!wh.is_default && (
                      <button
                        type="button"
                        onClick={() => onSetDefault(wh)}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #cbd5e1',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: '#b45309',
                          cursor: 'pointer',
                        }}
                        title="Set as default warehouse"
                      >
                        ★ Default
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onEdit(wh)}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        fontSize: '0.7rem',
                        color: '#0284c7',
                        cursor: 'pointer',
                      }}
                      title="Edit warehouse details"
                    >
                      ✏️
                    </button>
                    {!wh.is_default && (
                      <button
                        type="button"
                        onClick={() => onDelete(wh)}
                        style={{
                          background: '#fef2f2',
                          border: '1px solid #fecaca',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          fontSize: '0.7rem',
                          color: '#dc2626',
                          cursor: 'pointer',
                        }}
                        title="Delete warehouse"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
