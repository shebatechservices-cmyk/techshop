import { useState, useEffect } from 'react';
import API from '../../../services/api';

export function useUomManager({ isOpen, onUomUpdated }) {
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

  // Handle Add UOM
  const handleAddUom = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
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

  return {
    uoms,
    loading,
    errorMsg,
    setErrorMsg,
    successMsg,
    setSuccessMsg,
    newName,
    setNewName,
    newCode,
    setNewCode,
    newFractional,
    setNewFractional,
    newActive,
    setNewActive,
    adding,
    editingId,
    setEditingId,
    editName,
    setEditName,
    editCode,
    setEditCode,
    editFractional,
    setEditFractional,
    editActive,
    setEditActive,
    savingEdit,
    fetchUoms,
    handleAddUom,
    startEdit,
    cancelEdit,
    handleSaveEdit,
    handleDeleteUom
  };
}

export default useUomManager;
