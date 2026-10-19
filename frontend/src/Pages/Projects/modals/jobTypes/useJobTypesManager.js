import { useState, useEffect } from 'react';
import { smartFetch } from '../../../../services/api';

export function useJobTypesManager({ isOpen, onJobTypesUpdated }) {
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

  return {
    jobTypes,
    loading,
    errorMsg,
    successMsg,
    newName,
    setNewName,
    newDescription,
    setNewDescription,
    newActive,
    setNewActive,
    adding,
    editingId,
    editName,
    setEditName,
    editDescription,
    setEditDescription,
    editActive,
    setEditActive,
    savingEdit,
    handleAddJobType,
    startEdit,
    cancelEdit,
    handleSaveEdit,
    handleDeleteJobType,
  };
}
