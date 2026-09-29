import { useState, useEffect, useMemo } from 'react';
import API from '../../../services/api';

export function useWarehouseManager({ isOpen, onWarehouseUpdated } = {}) {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    location: '',
    address: '',
    contact_person: '',
    phone: '',
    is_default: false,
    is_active: true,
  });

  const showNotification = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // Fetch warehouses
  const loadWarehouses = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/warehouses`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setWarehouses(json.data);
          if (onWarehouseUpdated) {
            onWarehouseUpdated(json.data);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load warehouses:', err);
      showNotification('Failed to connect to warehouse server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      location: '',
      address: '',
      contact_person: '',
      phone: '',
      is_default: false,
      is_active: true,
    });
    setEditingId(null);
  };

  useEffect(() => {
    if (isOpen) {
      loadWarehouses();
      setShowForm(false);
      setEditingId(null);
      resetForm();
    }
  }, [isOpen]);

  const handleStartAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const handleStartEdit = (wh) => {
    setEditingId(wh.id);
    setFormData({
      name: wh.name || '',
      code: wh.code || '',
      location: wh.location || '',
      address: wh.address || '',
      contact_person: wh.contact_person || '',
      phone: wh.phone || '',
      is_default: Boolean(wh.is_default),
      is_active: wh.is_active !== undefined ? Boolean(wh.is_active) : true,
    });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (!formData.name.trim()) {
      showNotification('Warehouse name is required', 'error');
      return;
    }

    try {
      setSaving(true);
      const url = editingId ? `${API}/warehouses/${editingId}` : `${API}/warehouses`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showNotification(data.message || 'Warehouse saved successfully');
        setShowForm(false);
        resetForm();
        loadWarehouses();
      } else {
        showNotification(data.error || 'Failed to save warehouse', 'error');
      }
    } catch (err) {
      console.error('Save warehouse error:', err);
      showNotification('Network error while saving warehouse', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (wh) => {
    if (wh.is_default) return;
    try {
      const res = await fetch(`${API}/warehouses/${wh.id}/default`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(data.message || `Set "${wh.name}" as default`);
        loadWarehouses();
      } else {
        showNotification(data.error || 'Failed to set default warehouse', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Network error setting default warehouse', 'error');
    }
  };

  const handleDelete = async (wh) => {
    if (wh.is_default) {
      showNotification('Cannot delete default warehouse. Set another warehouse as default first.', 'error');
      return;
    }

    const confirmMsg = `Are you sure you want to delete warehouse "${wh.name}"?\nThis will remove it from active selection lists.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`${API}/warehouses/${wh.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(data.message || `Warehouse "${wh.name}" deleted`);
        loadWarehouses();
      } else {
        showNotification(data.error || 'Failed to delete warehouse', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Network error deleting warehouse', 'error');
    }
  };

  const filteredWarehouses = useMemo(() => {
    return warehouses.filter((wh) => {
      if (!searchFilter.trim()) return true;
      const q = searchFilter.toLowerCase();
      return (
        wh.name?.toLowerCase().includes(q) ||
        wh.code?.toLowerCase().includes(q) ||
        wh.location?.toLowerCase().includes(q) ||
        wh.address?.toLowerCase().includes(q) ||
        wh.contact_person?.toLowerCase().includes(q)
      );
    });
  }, [warehouses, searchFilter]);

  return {
    warehouses,
    setWarehouses,
    loading,
    setLoading,
    saving,
    setSaving,
    showForm,
    setShowForm,
    editingId,
    setEditingId,
    searchFilter,
    setSearchFilter,
    toast,
    setToast,
    formData,
    setFormData,
    filteredWarehouses,
    showNotification,
    loadWarehouses,
    resetForm,
    handleStartAdd,
    handleStartEdit,
    handleSave,
    handleSetDefault,
    handleDelete,
  };
}

export default useWarehouseManager;
