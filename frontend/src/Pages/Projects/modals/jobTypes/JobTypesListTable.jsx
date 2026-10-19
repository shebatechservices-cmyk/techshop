import React from 'react';
import JobTypeRow from './JobTypeRow';

export default function JobTypesListTable({
  jobTypes,
  loading,
  editingId,
  editName,
  setEditName,
  editDescription,
  setEditDescription,
  editActive,
  setEditActive,
  savingEdit,
  startEdit,
  cancelEdit,
  handleSaveEdit,
  handleDeleteJobType,
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
            <th style={{ padding: '8px 12px', width: '35%' }}>Job Type Name</th>
            <th style={{ padding: '8px 12px', width: '35%' }}>Description</th>
            <th style={{ padding: '8px 12px', width: '15%' }}>Status</th>
            <th style={{ padding: '8px 12px', width: '15%', textAlign: 'right' }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {loading && jobTypes.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}
              >
                Loading job types...
              </td>
            </tr>
          ) : jobTypes.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}
              >
                No job types found. Add your first job type above.
              </td>
            </tr>
          ) : (
            jobTypes.map((jt) => (
              <JobTypeRow
                key={jt.id}
                jt={jt}
                isEditing={editingId === jt.id}
                editName={editName}
                setEditName={setEditName}
                editDescription={editDescription}
                setEditDescription={setEditDescription}
                editActive={editActive}
                setEditActive={setEditActive}
                savingEdit={savingEdit}
                onStartEdit={startEdit}
                onCancelEdit={cancelEdit}
                onSaveEdit={handleSaveEdit}
                onDeleteJobType={handleDeleteJobType}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
