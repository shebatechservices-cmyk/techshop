import React from 'react';

export default function JobTypeRow({
  jt,
  isEditing,
  editName,
  setEditName,
  editDescription,
  setEditDescription,
  editActive,
  setEditActive,
  savingEdit,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDeleteJobType,
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
          <span style={{ fontWeight: 600, color: '#1e293b' }}>{jt.name}</span>
        )}
      </td>
      <td style={{ padding: '8px 12px' }}>
        {isEditing ? (
          <input
            type="text"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            style={{
              width: '100%',
              padding: '4px 6px',
              borderRadius: '4px',
              border: '1px solid #cbd5e1',
              fontSize: '0.8rem',
            }}
          />
        ) : (
          <span style={{ color: '#64748b', fontSize: '0.78rem' }}>
            {jt.description || '—'}
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
        ) : jt.is_active ? (
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
              onClick={() => onSaveEdit(jt.id)}
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
              onClick={() => onStartEdit(jt)}
              title="Edit Job Type"
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
              onClick={() => onDeleteJobType(jt.id, jt.name)}
              title="Delete Job Type"
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
