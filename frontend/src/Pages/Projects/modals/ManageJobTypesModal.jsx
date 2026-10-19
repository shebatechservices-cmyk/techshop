import React from 'react';
import JobTypeAddForm from './jobTypes/JobTypeAddForm';
import JobTypesListTable from './jobTypes/JobTypesListTable';
import { useJobTypesManager } from './jobTypes/useJobTypesManager';

export default function ManageJobTypesModal({ isOpen, onClose, onJobTypesUpdated }) {
  const manager = useJobTypesManager({ isOpen, onJobTypesUpdated });

  if (!isOpen) return null;

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
          {manager.errorMsg && (
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
              ⚠️ {manager.errorMsg}
            </div>
          )}

          {manager.successMsg && (
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
              ✓ {manager.successMsg}
            </div>
          )}

          <JobTypeAddForm
            newName={manager.newName}
            setNewName={manager.setNewName}
            newDescription={manager.newDescription}
            setNewDescription={manager.setNewDescription}
            newActive={manager.newActive}
            setNewActive={manager.setNewActive}
            adding={manager.adding}
            onAddJobType={manager.handleAddJobType}
          />

          {/* JOB TYPES TABLE */}
          <JobTypesListTable
            jobTypes={manager.jobTypes}
            loading={manager.loading}
            editingId={manager.editingId}
            editName={manager.editName}
            setEditName={manager.setEditName}
            editDescription={manager.editDescription}
            setEditDescription={manager.setEditDescription}
            editActive={manager.editActive}
            setEditActive={manager.setEditActive}
            savingEdit={manager.savingEdit}
            startEdit={manager.startEdit}
            cancelEdit={manager.cancelEdit}
            handleSaveEdit={manager.handleSaveEdit}
            handleDeleteJobType={manager.handleDeleteJobType}
          />
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
