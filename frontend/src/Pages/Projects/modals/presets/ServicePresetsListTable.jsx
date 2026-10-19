import React from 'react';
import ServicePresetRow from './ServicePresetRow';

export default function ServicePresetsListTable({
  presets,
  loading,
  editingId,
  editName,
  setEditName,
  editRate,
  setEditRate,
  editActive,
  setEditActive,
  savingEdit,
  startEdit,
  cancelEdit,
  handleSaveEdit,
  handleDeletePreset,
}) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '8px',
        border: '1px solid #cbd5e1',
        overflow: 'hidden',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
        <thead>
          <tr
            style={{
              background: '#f1f5f9',
              borderBottom: '1px solid #cbd5e1',
              color: '#475569',
              textAlign: 'left',
            }}
          >
            <th style={{ padding: '8px 12px', width: '45%' }}>Service Name</th>
            <th style={{ padding: '8px 12px', width: '22%' }}>Default Rate (৳)</th>
            <th style={{ padding: '8px 12px', width: '15%' }}>Status</th>
            <th style={{ padding: '8px 12px', width: '18%', textAlign: 'right' }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {loading && presets.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}
              >
                Loading presets...
              </td>
            </tr>
          ) : presets.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}
              >
                No service presets found. Add your first preset above.
              </td>
            </tr>
          ) : (
            presets.map((p) => (
              <ServicePresetRow
                key={p.id}
                preset={p}
                isEditing={editingId === p.id}
                editName={editName}
                setEditName={setEditName}
                editRate={editRate}
                setEditRate={setEditRate}
                editActive={editActive}
                setEditActive={setEditActive}
                savingEdit={savingEdit}
                onStartEdit={startEdit}
                onCancelEdit={cancelEdit}
                onSaveEdit={handleSaveEdit}
                onDeletePreset={handleDeletePreset}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
