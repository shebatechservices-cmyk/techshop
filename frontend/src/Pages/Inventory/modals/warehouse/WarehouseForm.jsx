import React from 'react';

export default function WarehouseForm({
  editingId,
  formData,
  setFormData,
  saving,
  onSave,
  onCancel,
}) {
  return (
    <form
      onSubmit={onSave}
      style={{
        background: '#f8fafc',
        border: '1.5px solid #0284c7',
        borderRadius: '8px',
        padding: '14px 16px',
        marginBottom: '16px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0369a1' }}>
          {editingId ? '✏️ Edit Warehouse Details' : '➕ Add New Warehouse / Branch'}
        </span>
        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
          Fields marked with * are required
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '10px' }}>
        {/* Name */}
        <div>
          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: '3px' }}>
            Warehouse Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Main Shop, Agrabad Branch"
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.82rem',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Code */}
        <div>
          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: '3px' }}>
            Warehouse Code / Tag
          </label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="e.g. WH-MAIN, WH-01"
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.82rem',
              fontFamily: 'monospace',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Location / Area */}
        <div>
          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: '3px' }}>
            City / Location Zone
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g. Dhaka Central, Chittagong Port"
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.82rem',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '10px' }}>
        {/* Full Address */}
        <div style={{ gridColumn: 'span 2' }}>
          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: '3px' }}>
            Full Address / Road
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="e.g. Level 3, Suite 402, Motijheel C/A, Dhaka"
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.82rem',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Contact Person */}
        <div>
          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: '3px' }}>
            Contact Person Name
          </label>
          <input
            type="text"
            value={formData.contact_person}
            onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            placeholder="e.g. Store Manager"
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.82rem',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Phone */}
        <div>
          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: '3px' }}>
            Phone / Mobile Number
          </label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="e.g. 017xxxxxxxx"
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.82rem',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Toggles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', margin: '12px 0 14px 0', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={formData.is_default}
            onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
            style={{ cursor: 'pointer' }}
          />
          <span>★ Set as Default Warehouse</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            style={{ cursor: 'pointer' }}
          />
          <span>🟢 Active (Available for Sales & Purchases)</span>
        </label>
      </div>

      {/* Form Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            color: '#475569',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '6px 18px',
            borderRadius: '6px',
            border: 'none',
            background: '#0284c7',
            color: '#ffffff',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving...' : editingId ? '✓ Update Warehouse' : '✓ Create Warehouse'}
        </button>
      </div>
    </form>
  );
}
