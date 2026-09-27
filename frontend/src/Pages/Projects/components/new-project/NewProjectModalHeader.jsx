import React from 'react';

export default function NewProjectModalHeader({ isEditMode, projectCode, onClose }) {
  return (
    <div
      style={{
        padding: '18px 24px',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#ffffff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}
    >
      <div>
        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
          {isEditMode ? `✏️ Edit Work Order (${projectCode || 'PRJ'})` : 'New Project / Service Entry & Technician Handover'}
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
          {isEditMode
            ? 'Update technician assignment, dynamic service tasks (Router, ONU, Camera, TV setup), and payout details.'
            : 'Attach invoice, configure dynamic service tasks, setup fees, conveyance, and assign technician for work order.'}
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}
      >
        ✕
      </button>
    </div>
  );
}
