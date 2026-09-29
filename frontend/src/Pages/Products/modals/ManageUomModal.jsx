import React from 'react';
import useUomManager from '../hooks/useUomManager';
import UomAddForm from '../components/modal/UomAddForm';
import UomTable from '../components/modal/UomTable';

export default function ManageUomModal({ isOpen, onClose, onUomUpdated }) {
  const {
    uoms,
    loading,
    errorMsg,
    successMsg,
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
    editName,
    setEditName,
    editCode,
    setEditCode,
    editFractional,
    setEditFractional,
    editActive,
    setEditActive,
    savingEdit,
    handleAddUom,
    startEdit,
    cancelEdit,
    handleSaveEdit,
    handleDeleteUom
  } = useUomManager({ isOpen, onUomUpdated });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-[10001] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="py-4 px-5 bg-gradient-to-br from-sky-600 to-sky-700 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl">📏</span>
            <div>
              <h3 className="text-base font-bold text-white leading-snug">
                Manage Units of Measurement (UOM)
              </h3>
              <p className="text-xs text-sky-100 mt-0.5">
                Add, edit, or configure measurement units and fractional selling permissions.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white hover:text-sky-200 text-xl font-bold cursor-pointer transition-colors p-1"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs mb-3 flex items-center gap-1.5">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs mb-3 flex items-center gap-1.5">
              <span>✓</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* ADD NEW UOM FORM */}
          <UomAddForm
            newName={newName}
            setNewName={setNewName}
            newCode={newCode}
            setNewCode={setNewCode}
            newFractional={newFractional}
            setNewFractional={setNewFractional}
            newActive={newActive}
            setNewActive={setNewActive}
            adding={adding}
            handleAddUom={handleAddUom}
          />

          {/* UOM TABLE */}
          <UomTable
            uoms={uoms}
            loading={loading}
            editingId={editingId}
            editName={editName}
            setEditName={setEditName}
            editCode={editCode}
            setEditCode={setEditCode}
            editFractional={editFractional}
            setEditFractional={setEditFractional}
            editActive={editActive}
            setEditActive={setEditActive}
            savingEdit={savingEdit}
            handleSaveEdit={handleSaveEdit}
            cancelEdit={cancelEdit}
            startEdit={startEdit}
            handleDeleteUom={handleDeleteUom}
          />
        </div>

        {/* MODAL FOOTER */}
        <div className="py-3 px-5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-4 rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
