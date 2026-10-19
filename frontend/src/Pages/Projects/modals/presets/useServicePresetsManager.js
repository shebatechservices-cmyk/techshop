import { useState, useEffect } from 'react';
import { smartFetch } from '../../../../services/api';

export function useServicePresetsManager({ isOpen, onPresetsUpdated }) {
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
    setEditRate(p.default_rate !== null && p.default_rate !== undefined ? String(p.default_rate) : '');
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
        setSuccessMsg(`Preset "${name}" deleted.`);
        fetchPresets();
      } else {
        setErrorMsg(data.message || 'Failed to delete preset.');
      }
    } catch (err) {
      console.error('Delete preset error:', err);
      setErrorMsg('Server error deleting preset.');
    }
  };

  return {
    presets,
    loading,
    errorMsg,
    successMsg,
    newName,
    setNewName,
    newRate,
    setNewRate,
    newActive,
    setNewActive,
    adding,
    editingId,
    editName,
    setEditName,
    editRate,
    setEditRate,
    editActive,
    setEditActive,
    savingEdit,
    handleAddPreset,
    startEdit,
    cancelEdit,
    handleSaveEdit,
    handleDeletePreset,
  };
}
