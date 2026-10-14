import React from 'react';

export default function JobTypeAddForm({
  newName,
  setNewName,
  newDescription,
  setNewDescription,
  newActive,
  setNewActive,
  adding,
  onAddJobType,
}) {
  return (
    <div
      style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '14px',
        marginBottom: '16px',
      }}
    >
      <span
        style={{
          display: 'block',
          fontSize: '0.82rem',
          fontWeight: 700,
          color: '#0f172a',
          marginBottom: '8px',
        }}
      >
        + Add New Job Type
      </span>
      <form
        onSubmit={onAddJobType}
        style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          placeholder="Job Type Name (e.g. Access Control)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          required
          style={{
            flex: '2 1 180px',
            padding: '7px 10px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontSize: '0.82rem',
            boxSizing: 'border-box',
          }}
        />
        <input
          type="text"
          placeholder="Brief Description (Optional)"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          style={{
            flex: '2 1 200px',
            padding: '7px 10px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontSize: '0.82rem',
            boxSizing: 'border-box',
          }}
        />
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.78rem',
            color: '#475569',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={newActive}
            onChange={(e) => setNewActive(e.target.checked)}
          />
          Active
        </label>
        <button
          type="submit"
          disabled={adding}
          style={{
            padding: '7px 14px',
            borderRadius: '6px',
            border: 'none',
            background: '#0284c7',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: adding ? 'not-allowed' : 'pointer',
          }}
        >
          {adding ? 'Adding...' : '+ Add'}
        </button>
      </form>
    </div>
  );
}
