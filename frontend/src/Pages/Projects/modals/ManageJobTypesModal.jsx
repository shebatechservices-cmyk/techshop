import React, { useState, useEffect } from 'react';
import { smartFetch } from '../../../services/api';
import JobTypeAddForm from './jobTypes/JobTypeAddForm';
import JobTypeRow from './jobTypes/JobTypeRow';

export default function ManageJobTypesModal({ isOpen, onClose, onJobTypesUpdated }) {
  const [jobTypes, setJobTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // New Job Type Form State
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newActive, setNewActive] = useState(true);
  const [adding, setAdding] = useState(false);

  // Edit Mode State
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

  // Fetch all job types
  const fetchJobTypes = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await smartFetch('/projects/job-types');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setJobTypes(json.data);
          if (onJobTypesUpdated) onJobTypesUpdated(json.data);
        }
      } else {
        setErrorMsg('Failed to load job types');
      }
    } catch (err) {
      console.error('Error fetching job types:', err);
      setErrorMsg('Server error loading job types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchJobTypes();
      setEditingId(null);
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Add Job Type
  const handleAddJobType = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      setErrorMsg('Please enter a job type name.');
      return;
    }

    try {
      setAdding(true);
      setErrorMsg('');
      setSuccessMsg('');

      const res = await smartFetch('/projects/job-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription.trim() || null,
          is_active: Boolean(newActive),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('Job type added successfully!');
        setNewName('');
        setNewDescription('');
        setNewActive(true);
        fetchJobTypes();
      } else {
        setErrorMsg(data.message || 'Failed to add job type.');
      }
    } catch (err) {
      console.error('Add job type error:', err);
      setErrorMsg('Server error adding job type.');
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (jt) => {
    setEditingId(jt.id);
    setEditName(jt.name);
    setEditDescription(jt.description || '');
    setEditActive(jt.is_active);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditDescription('');
  };

  const handleSaveEdit = async (id) => {
    if (!editName.trim()) {
      setErrorMsg('Job type name cannot be empty.');
      return;
    }

    try {
      setSavingEdit(true);
      setErrorMsg('');
      setSuccessMsg('');

      const res = await smartFetch(`/projects/job-types/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || null,
          is_active: Boolean(editActive),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('Job type updated!');
        setEditingId(null);
        fetchJobTypes();
      } else {
        setErrorMsg(data.message || 'Failed to update job type.');
      }
    } catch (err) {
      console.error('Update job type error:', err);
      setErrorMsg('Server error updating job type.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteJobType = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete job type "${name}"?`)) return;

    try {
      const res = await smartFetch(`/projects/job-types/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Job type "${name}" deleted.`);
        fetchJobTypes();
      } else {
        setErrorMsg(data.message || 'Failed to delete job type.');
      }
    } catch (err) {
      console.error('Delete job type error:', err);
      setErrorMsg('Server error deleting job type.');
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
          maxWidth: '700px',
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
            <span style={{ fontSize: '1.25rem' }}>📋</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                Manage Project / Job Types
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#e0f2fe' }}>
                Add, edit, or configure customizable service lines and job classifications.
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

          <JobTypeAddForm
            newName={newName}
            setNewName={setNewName}
            newDescription={newDescription}
            setNewDescription={setNewDescription}
            newActive={newActive}
            setNewActive={setNewActive}
            adding={adding}
            onAddJobType={handleAddJobType}
          />

          {/* JOB TYPES TABLE */}
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
