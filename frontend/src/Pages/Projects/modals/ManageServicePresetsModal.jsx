import React, { useState, useEffect } from 'react';
import API from '../../../services/api';

export default function ManageServicePresetsModal({ isOpen, onClose, onPresetsUpdated }) {
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // New Preset Form State
  const [newName, setNewName] = useState('');
  const [newRate, setNewRate] = useState('');
  const [newActive, setNewActive] = useState(true);
  const [adding, setAdding] = useState(false);

  // Edit Mode State
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRate, setEditRate] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

  // Fetch all presets
  const fetchPresets = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await fetch(`${API}/projects/service-presets`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setPresets(json.data);
          if (onPresetsUpdated) onPresetsUpdated(json.data);
        }
      } else {
        setErrorMsg('Failed to load service presets');
      }
    } catch (err) {
      console.error('Error fetching presets:', err);
      setErrorMsg('Server error loading service presets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPresets();
      setEditingId(null);
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Add Preset
  const handleAddPreset = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      setErrorMsg('Please enter a service name.');
      return;
    }

    try {
      setAdding(true);
      setErrorMsg('');
      setSuccessMsg('');

      const res = await fetch(`${API}/projects/service-presets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          default_rate: parseFloat(newRate) || 0,
          is_active: Boolean(newActive)
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('Service preset added successfully!');
        setNewName('');
        setNewRate('');
        setNewActive(true);
        fetchPresets();
      } else {
        setErrorMsg(data.message || 'Failed to add preset.');
      }
    } catch (err) {
      console.error('Add preset error:', err);
      setErrorMsg('Server error adding preset.');
    } finally {
      setAdding(false);
    }
  };

  // Start Editing a row
  const startEdit = (p) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditRate(p.default_rate);
    setEditActive(p.is_active);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditRate('');
  };

  // Handle Save Edit
  const handleSaveEdit = async (id) => {
    if (!editName.trim()) {
      setErrorMsg('Service name cannot be empty.');
      return;
    }

    try {
      setSavingEdit(true);
      setErrorMsg('');
      setSuccessMsg('');

      const res = await fetch(`${API}/projects/service-presets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          default_rate: parseFloat(editRate) || 0,
          is_active: Boolean(editActive)
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('Service preset updated!');
        setEditingId(null);
        fetchPresets();
      } else {
        setErrorMsg(data.message || 'Failed to update preset.');
      }
    } catch (err) {
      console.error('Update preset error:', err);
      setErrorMsg('Server error updating preset.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Handle Delete Preset
  const handleDeletePreset = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete preset "${name}"?`)) return;

    try {
      const res = await fetch(`${API}/projects/service-presets/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Preset "${name}" removed.`);
        fetchPresets();
      } else {
        setErrorMsg(data.message || 'Failed to delete preset.');
      }
    } catch (err) {
      console.error('Delete preset error:', err);
      setErrorMsg('Server error deleting preset.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 10001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div
          style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem' }}>⚙️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                Manage Service Task Presets
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#e0f2fe' }}>
                Add, edit, or customize quick preset tasks and default remuneration rates.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '1.3rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* MODAL BODY */}
        <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1 }}>
          {/* Feedback Messages */}
          {errorMsg && (
            <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '12px' }}>
              ⚠️ {errorMsg}
            </div>
          )}
          {successMsg && (
            <div style={{ padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '12px' }}>
              ✓ {successMsg}
            </div>
          )}

          {/* ADD NEW PRESET FORM */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
            <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              + Add New Service Preset
            </span>
            <form onSubmit={handleAddPreset} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Service Name (e.g. Fiber Splicing)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                style={{ flex: '2 1 180px', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
              />
              <input
                type="number"
                min="0"
                placeholder="Rate (৳)"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                style={{ flex: '1 1 100px', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#475569', cursor: 'pointer' }}>
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
                  cursor: adding ? 'not-allowed' : 'pointer'
                }}
              >
                {adding ? 'Adding...' : '+ Add'}
              </button>
            </form>
          </div>

          {/* PRESETS TABLE */}
          <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px', width: '45%' }}>Service Name</th>
                  <th style={{ padding: '8px 12px', width: '22%' }}>Default Rate (৳)</th>
                  <th style={{ padding: '8px 12px', width: '15%' }}>Status</th>
                  <th style={{ padding: '8px 12px', width: '18%', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && presets.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                      Loading presets...
                    </td>
                  </tr>
                ) : presets.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                      No service presets found. Add your first preset above.
                    </td>
                  </tr>
                ) : (
                  presets.map((p) => {
                    const isEditing = editingId === p.id;
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px' }}>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              style={{ width: '100%', padding: '4px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                            />
                          ) : (
                            <span style={{ fontWeight: 600, color: '#1e293b' }}>{p.name}</span>
                          )}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              value={editRate}
                              onChange={(e) => setEditRate(e.target.value)}
                              style={{ width: '90px', padding: '4px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                            />
                          ) : (
                            <span style={{ fontWeight: 700, color: '#0284c7' }}>
                              ৳ {Number(p.default_rate || 0).toLocaleString('en-BD')}
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
                          ) : p.is_active ? (
                            <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                              Active
                            </span>
                          ) : (
                            <span style={{ background: '#f1f5f9', color: '#64748b', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600 }}>
                              Inactive
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(p.id)}
                                disabled={savingEdit}
                                style={{ padding: '3px 8px', borderRadius: '4px', background: '#16a34a', color: '#fff', border: 'none', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                style={{ padding: '3px 8px', borderRadius: '4px', background: '#e2e8f0', color: '#475569', border: 'none', fontSize: '0.74rem', cursor: 'pointer' }}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                onClick={() => startEdit(p)}
                                title="Edit Preset"
                                style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', fontSize: '0.85rem' }}
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePreset(p.id, p.name)}
                                title="Delete Preset"
                                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div style={{ padding: '12px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '7px 18px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: '#fff',
              color: '#475569',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
