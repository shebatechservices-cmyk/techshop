import React from 'react';

export default function ServicePresetRow({
  preset,
  isEditing,
  editName,
  setEditName,
  editRate,
  setEditRate,
  editActive,
  setEditActive,
  savingEdit,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDeletePreset,
}) {
  return (
    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
      <td style={{ padding: '8px 12px' }}>
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            style={{
              width: '100%',
              padding: '4px 6px',
              borderRadius: '4px',
              border: '1px solid #cbd5e1',
              fontSize: '0.8rem',
            }}
          />
        ) : (
          <span style={{ fontWeight: 600, color: '#1e293b' }}>{preset.name}</span>
        )}
      </td>
      <td style={{ padding: '8px 12px' }}>
        {isEditing ? (
          <input
            type="number"
            min="0"
            value={editRate}
            onChange={(e) => setEditRate(e.target.value)}
            style={{
              width: '90px',
              padding: '4px 6px',
              borderRadius: '4px',
              border: '1px solid #cbd5e1',
              fontSize: '0.8rem',
            }}
          />
        ) : (
          <span style={{ fontWeight: 700, color: '#0284c7' }}>
            ৳ {Number(preset.default_rate || 0).toLocaleString('en-BD')}
          </span>
        )}
      </td>
      <td style={{ padding: '8px 12px' }}>
        {isEditing ? (
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem' }}>
            <input
              type="checkbox"
              checked={editActive}
              onChange={(e) => setEditActive(e.target.checked)}
            />
            Active
          </label>
        ) : preset.is_active ? (
          <span
            style={{
              background: '#dcfce7',
              color: '#15803d',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '0.72rem',
              fontWeight: 700,
            }}
          >
            Active
          </span>
        ) : (
          <span
            style={{
              background: '#f1f5f9',
              color: '#64748b',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '0.72rem',
              fontWeight: 600,
            }}
          >
            Inactive
          </span>
        )}
      </td>
      <td style={{ padding: '8px 12px', textAlign: 'right' }}>
        {isEditing ? (
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => onSaveEdit(preset.id)}
              disabled={savingEdit}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                background: '#16a34a',
                color: '#fff',
                border: 'none',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Save
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                background: '#e2e8f0',
                color: '#475569',
                border: 'none',
                fontSize: '0.74rem',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => onStartEdit(preset)}
              title="Edit Preset"
              style={{
                background: 'none',
                border: 'none',
                color: '#0284c7',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              ✏️
            </button>
            <button
              type="button"
              onClick={() => onDeletePreset(preset.id, preset.name)}
              title="Delete Preset"
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              🗑️
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
