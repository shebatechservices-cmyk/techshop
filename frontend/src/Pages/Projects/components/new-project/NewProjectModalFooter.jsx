import React from 'react';

export default function NewProjectModalFooter({
  isEditMode,
  submitting,
  onClose
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
      <button
        type="button"
        onClick={onClose}
        disabled={submitting}
        style={{
          padding: '8px 18px',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          background: '#fff',
          color: '#475569',
          fontWeight: 600,
          fontSize: '0.85rem',
          cursor: submitting ? 'not-allowed' : 'pointer'
        }}
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={submitting}
        style={{
          padding: '8px 22px',
          borderRadius: '8px',
          border: 'none',
          background: submitting ? '#94a3b8' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          color: '#fff',
          fontWeight: 700,
          fontSize: '0.85rem',
          cursor: submitting ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 6px -1px rgba(2, 132, 199, 0.3)'
        }}
      >
        {submitting ? 'Saving...' : (isEditMode ? 'Update Work Order ➔' : 'Handover & Assign Work Order ➔')}
      </button>
    </div>
  );
}
