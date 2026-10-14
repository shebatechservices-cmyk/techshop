import React, { useState, useEffect } from 'react';
import { smartFetch } from '../../../services/api';
import ServicePresetAddForm from './presets/ServicePresetAddForm';
import ServicePresetRow from './presets/ServicePresetRow';

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
      const res = await smartFetch('/projects/service-presets');
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

      const res = await smartFetch('/projects/service-presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          default_rate: parseFloat(newRate) || 0,
          is_active: Boolean(newActive),
        }),
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

  const handleSaveEdit = async (id) => {
    if (!editName.trim()) {
      setErrorMsg('Service name cannot be empty.');
      return;
    }

    try {
      setSavingEdit(true);
      setErrorMsg('');
      setSuccessMsg('');

      const res = await smartFetch(`/projects/service-presets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          default_rate: parseFloat(editRate) || 0,
          is_active: Boolean(editActive),
        }),
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

  const handleDeletePreset = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete preset "${name}"?`)) return;

    try {
      const res = await smartFetch(`/projects/service-presets/${id}`, {
        method: 'DELETE',
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
        padding: '16px',
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
          border: '1px solid #e2e8f0',
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
            alignItems: 'center',
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
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              fontSize: '1.3rem',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* MODAL BODY */}
        <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1 }}>
          {errorMsg && (
            <div
              style={{
                padding: '8px 12px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                borderRadius: '8px',
                fontSize: '0.8rem',
                marginBottom: '12px',
              }}
            >
              ⚠️ {errorMsg}
            </div>
          )}
          {successMsg && (
            <div
              style={{
                padding: '8px 12px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#15803d',
                borderRadius: '8px',
                fontSize: '0.8rem',
                marginBottom: '12px',
              }}
            >
              ✓ {successMsg}
            </div>
          )}

          <ServicePresetAddForm
            newName={newName}
            setNewName={setNewName}
            newRate={newRate}
            setNewRate={setNewRate}
            newActive={newActive}
            setNewActive={setNewActive}
            adding={adding}
            onAddPreset={handleAddPreset}
          />

          {/* PRESETS TABLE */}
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
        </div>

        {/* MODAL FOOTER */}
        <div
          style={{
            padding: '12px 20px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
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
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
