import React from 'react';
import useWarehouseManager from './warehouse/useWarehouseManager';
import WarehouseForm from './warehouse/WarehouseForm';
import WarehouseTable from './warehouse/WarehouseTable';

export default function WarehouseManageModal({ isOpen, onClose, onWarehouseUpdated }) {
  const {
    warehouses, loading, saving, showForm, setShowForm, editingId,
    searchFilter, setSearchFilter, toast, formData, setFormData,
    filteredWarehouses, resetForm, handleStartAdd, handleStartEdit,
    handleSave, handleSetDefault, handleDelete,
  } = useWarehouseManager({ isOpen, onWarehouseUpdated });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-6 right-6 z-[60] px-4 py-2.5 rounded-lg text-white font-bold text-sm shadow-xl flex items-center gap-2 animate-fade-in ${
            toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
          }`}
        >
          <span>{toast.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Modal Dialog */}
      <div
        className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-sky-100 border border-sky-200 flex items-center justify-center text-lg">
              🏬
            </div>
            <div>
              <h2 className="m-0 text-base font-extrabold text-slate-900">Warehouse & Branch Management</h2>
              <p className="m-0 text-xs text-slate-500">Configure central godowns, retail outlets, and stock distribution nodes.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md w-7 h-7 font-bold text-slate-600 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Action & Filter Bar */}
        <div className="px-5 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between gap-2.5 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search by warehouse name, code, location..."
              className="w-full py-1.5 pl-10 pr-3 rounded-md border border-slate-300 text-sm outline-none focus:border-sky-500"
              style={{ paddingLeft: '2.5rem' }}
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
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md font-bold text-xs text-white shadow-sm transition-colors ${
              showForm ? 'bg-slate-600 hover:bg-slate-700' : 'bg-sky-600 hover:bg-sky-700'
            }`}
          >
            <span>{showForm ? '✕ Close Form' : '➕ Add Warehouse'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1">
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

          <WarehouseTable
            loading={loading}
            warehouses={filteredWarehouses}
            onSetDefault={handleSetDefault}
            onEdit={handleStartEdit}
            onDelete={handleDelete}
          />
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 flex justify-between items-center bg-slate-50">
          <span className="text-xs text-slate-500">
            Total Warehouses: <strong className="text-slate-700">{warehouses.length}</strong> (Active: {warehouses.filter((w) => w.is_active).length})
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
