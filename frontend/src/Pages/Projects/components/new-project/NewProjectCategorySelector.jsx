import React from 'react';

export default function NewProjectCategorySelector({
  projectCategory,
  setProjectCategory,
  setProjectType,
  setSelectedInvoice,
  setEquipmentDetails
}) {
  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
      <button
        type="button"
        onClick={() => {
          setProjectCategory('new_setup');
          setProjectType('CCTV Installation');
        }}
        style={{
          flex: 1,
          padding: '10px 14px',
          borderRadius: '8px',
          border: 'none',
          background: projectCategory === 'new_setup' ? '#0284c7' : 'transparent',
          color: projectCategory === 'new_setup' ? '#ffffff' : '#475569',
          fontWeight: 700,
          fontSize: '0.86rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.15s ease'
        }}
      >
        <span>📦</span>
        <span>New Setup (Invoice Reference)</span>
      </button>
      <button
        type="button"
        onClick={() => {
          setProjectCategory('old_repair');
          setProjectType('Repair & Servicing');
          setSelectedInvoice(null);
          setEquipmentDetails([]);
        }}
        style={{
          flex: 1,
          padding: '10px 14px',
          borderRadius: '8px',
          border: 'none',
          background: projectCategory === 'old_repair' ? '#0284c7' : 'transparent',
          color: projectCategory === 'old_repair' ? '#ffffff' : '#475569',
          fontWeight: 700,
          fontSize: '0.86rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.15s ease'
        }}
      >
        <span>🔧</span>
        <span>Existing Setup Repair & Maintenance</span>
      </button>
    </div>
  );
}
