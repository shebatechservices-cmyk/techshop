import React, { useState, useEffect } from 'react';
import API from '../../../services/api';

export default function ManageUomModal({ isOpen, onClose, onUomUpdated }) {
  const [uoms, setUoms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Add Form State
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newFractional, setNewFractional] = useState(false);
  const [newActive, setNewActive] = useState(true);
  const [adding, setAdding] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editFractional, setEditFractional] = useState(false);
  const [editActive, setEditActive] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchUoms = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await fetch(`${API}/uom`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setUoms(json.data);
          if (onUomUpdated) onUomUpdated(json.data);
        }
      } else {
        setErrorMsg('Failed to load Units of Measurement');
      }
    } catch (err) {
      console.error('Error fetching UOMs:', err);
      setErrorMsg('Server error loading Units of Measurement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUoms();
      setEditingId(null);
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Add UOM
  const handleAddUom = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      setErrorMsg('Please enter a unit name.');
      return;
    }

    try {
      setAdding(true);
      setErrorMsg('');
      setSuccessMsg('');

      const res = await fetch(`${API}/uom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          code: newCode.trim().toUpperCase() || null,
          is_fractional_allowed: Boolean(newFractional),
          is_active: Boolean(newActive)
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Unit "${data.data.name}" added successfully!`);
        setNewName('');
        setNewCode('');
        setNewFractional(false);
        setNewActive(true);
        fetchUoms();
      } else {
        setErrorMsg(data.message || 'Failed to add unit.');
      }
    } catch (err) {
      console.error('Add unit error:', err);
      setErrorMsg('Server error adding unit.');
    } finally {
      setAdding(false);
    }
  };

  // Start Edit
  const startEdit = (u) => {
    setEditingId(u.id);
    setEditName(u.name);
    setEditCode(u.code || '');
    setEditFractional(u.is_fractional_allowed);
    setEditActive(u.is_active);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditCode('');
  };

  // Handle Save Edit
  const handleSaveEdit = async (id) => {
    if (!editName.trim()) {
      setErrorMsg('Unit name cannot be empty.');
      return;
    }

    try {
      setSavingEdit(true);
      setErrorMsg('');
      setSuccessMsg('');

      const res = await fetch(`${API}/uom/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          code: editCode.trim().toUpperCase() || null,
          is_fractional_allowed: Boolean(editFractional),
          is_active: Boolean(editActive)
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('Unit updated successfully!');
        setEditingId(null);
        fetchUoms();
      } else {
        setErrorMsg(data.message || 'Failed to update unit.');
      }
    } catch (err) {
      console.error('Update unit error:', err);
      setErrorMsg('Server error updating unit.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Handle Delete UOM
  const handleDeleteUom = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete unit "${name}"?`)) return;

    try {
      const res = await fetch(`${API}/uom/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Unit "${name}" deleted.`);
        fetchUoms();
      } else {
        setErrorMsg(data.message || 'Failed to delete unit.');
      }
    } catch (err) {
      console.error('Delete unit error:', err);
      setErrorMsg('Server error deleting unit.');
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
          maxWidth: '750px',
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
            <span style={{ fontSize: '1.25rem' }}>📏</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                Manage Units of Measurement (UOM)
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#e0f2fe' }}>
                Add, edit, or configure measurement units and fractional selling permissions.
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

          {/* ADD NEW UOM FORM */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
            <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              + Add New Unit of Measurement
            </span>
            <form onSubmit={handleAddUom} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Unit Name (e.g. Meter, Box, Pcs)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                style={{ flex: '2 1 160px', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
              />
              <input
                type="text"
                placeholder="Code (e.g. MTR, BOX)"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                style={{ flex: '1 1 90px', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box', textTransform: 'uppercase' }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#0369a1', fontWeight: 600, cursor: 'pointer', background: '#e0f2fe', padding: '6px 8px', borderRadius: '6px' }}>
                <input
                  type="checkbox"
                  checked={newFractional}
                  onChange={(e) => setNewFractional(e.target.checked)}
                />
                Allow Fractional (e.g. 1.5)
              </label>
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

          {/* UOM TABLE */}
          <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px', width: '32%' }}>Unit Name</th>
                  <th style={{ padding: '8px 12px', width: '18%' }}>Short Code</th>
                  <th style={{ padding: '8px 12px', width: '25%' }}>Fractional Qty</th>
                  <th style={{ padding: '8px 12px', width: '12%' }}>Status</th>
                  <th style={{ padding: '8px 12px', width: '13%', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && uoms.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                      Loading units of measurement...
                    </td>
                  </tr>
                ) : uoms.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                      No measurement units found. Add your first unit above.
                    </td>
                  </tr>
                ) : (
                  uoms.map((u) => {
                    const isEditing = editingId === u.id;
                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px' }}>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              style={{ width: '100%', padding: '4px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                            />
                          ) : (
                            <span style={{ fontWeight: 600, color: '#1e293b' }}>{u.name}</span>
                          )}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editCode}
                              onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                              style={{ width: '80px', padding: '4px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', textTransform: 'uppercase' }}
                            />
                          ) : (
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0284c7', background: '#f0f9ff', padding: '2px 6px', borderRadius: '4px' }}>
                              {u.code || '—'}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          {isEditing ? (
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', color: '#0369a1', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={editFractional}
                                onChange={(e) => setEditFractional(e.target.checked)}
                              />
                              Allow Fractional
                            </label>
                          ) : u.is_fractional_allowed ? (
                            <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                              ✓ Fractional Allowed
                            </span>
                          ) : (
                            <span style={{ background: '#f1f5f9', color: '#64748b', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600 }}>
                              Whole Units Only
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
                          ) : u.is_active ? (
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
                                onClick={() => handleSaveEdit(u.id)}
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
                                onClick={() => startEdit(u)}
                                title="Edit Unit"
                                style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', fontSize: '0.85rem' }}
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteUom(u.id, u.name)}
                                title="Delete Unit"
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
