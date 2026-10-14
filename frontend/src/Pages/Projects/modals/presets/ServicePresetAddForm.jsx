import React from 'react';

export default function ServicePresetAddForm({
  newName,
  setNewName,
  newRate,
  setNewRate,
  newActive,
  setNewActive,
  adding,
  onAddPreset,
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
        + Add New Service Preset
      </span>
      <form
        onSubmit={onAddPreset}
        style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          placeholder="Service Name (e.g. Fiber Splicing)"
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
          type="number"
          min="0"
          placeholder="Rate (৳)"
          value={newRate}
          onChange={(e) => setNewRate(e.target.value)}
          style={{
            flex: '1 1 100px',
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
