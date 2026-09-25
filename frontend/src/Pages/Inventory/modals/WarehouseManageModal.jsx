import React, { useState, useEffect } from 'react';
import API from '../../../services/api';
import WarehouseForm from './warehouse/WarehouseForm';
import WarehouseTable from './warehouse/WarehouseTable';

export default function WarehouseManageModal({ isOpen, onClose, onWarehouseUpdated }) {
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

  useEffect(() => {
    if (isOpen) {
      loadWarehouses();
      setShowForm(false);
      setEditingId(null);
      resetForm();
    }
  }, [isOpen]);

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
    e.preventDefault();
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

  if (!isOpen) return null;

  const filteredWarehouses = warehouses.filter((wh) => {
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

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      {/* Toast Notification */}
      {toast.show && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 100000,
            padding: '10px 18px',
            borderRadius: '8px',
            background: toast.type === 'error' ? '#ef4444' : '#10b981',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.86rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <span>{toast.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #cbd5e1',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1.5px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#e0f2fe',
                border: '1px solid #bae6fd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
              }}
            >
              🏬
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                Warehouse & Branch Management
              </h2>
              <p style={{ margin: 0, fontSize: '0.74rem', color: '#64748b' }}>
                Configure central godowns, retail outlets, and stock distribution nodes.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              width: '28px',
              height: '28px',
              cursor: 'pointer',
              fontWeight: 700,
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Action & Filter Bar */}
        <div
          style={{
            padding: '10px 20px',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.8rem' }}>🔍</span>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search by warehouse name, code, location..."
              style={{
                width: '100%',
                padding: '6px 10px 6px 30px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.8rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              if (showForm) {
                setShowForm(false);
                resetForm();
              } else {
                handleStartAdd();
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: showForm ? '#475569' : '#0284c7',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(2, 132, 199, 0.2)',
            }}
          >
            <span>{showForm ? '✕ Close Form' : '➕ Add Warehouse'}</span>
          </button>
        </div>

        {/* Modal Body Container */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
          {/* Add / Edit Form Panel */}
          {showForm && (
            <WarehouseForm
              editingId={editingId}
              formData={formData}
              setFormData={setFormData}
              saving={saving}
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false);
                resetForm();
              }}
            />
          )}

          {/* Warehouses Table / Grid */}
          <WarehouseTable
            loading={loading}
            warehouses={filteredWarehouses}
            onSetDefault={handleSetDefault}
            onEdit={handleStartEdit}
            onDelete={handleDelete}
          />
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '10px 20px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc',
          }}
        >
          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
            Total Warehouses: <strong>{warehouses.length}</strong> (Active: {warehouses.filter((w) => w.is_active).length})
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 16px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
