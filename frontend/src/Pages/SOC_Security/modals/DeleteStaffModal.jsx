import React from "react";

export default function DeleteStaffModal({
  staffToDelete,
  onClose,
  handleConfirmDeleteStaff,
}) {
  if (!staffToDelete) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/65 backdrop-blur-[3px] flex items-center justify-center z-[99999] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl border border-slate-200">
        <div className="text-4xl mb-2">⚠️</div>
        <h3 className="m-0 mb-2 text-lg font-black text-slate-900">
          Delete Staff / Technician?
        </h3>
        <p className="text-sm text-slate-500 mt-0 mb-5 leading-relaxed">
          Are you sure you want to remove <strong>{staffToDelete.name}</strong> ({staffToDelete.role_name || "Staff"})? The account will be deactivated and moved to Trash.
        </p>
        <div className="flex justify-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4.5 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmDeleteStaff}
            className="px-5 py-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm cursor-pointer transition-colors border-0"
          >
            Move to Trash
          </button>
        </div>
      </div>
    </div>
  );
}
