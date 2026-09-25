import React from 'react';

export default function StaffDeleteModal({
  isOpen,
  onClose,
  staff,
  onConfirm,
  deleting
}) {
  if (!isOpen || !staff) return null;

  const isSuperAdminRoot = Number(staff.id) === 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-2xl mx-auto mb-4">
          🗑️
        </div>

        <h3 className="text-base font-bold text-slate-900 mb-1">
          {isSuperAdminRoot ? 'Cannot Delete Primary Super Admin' : `Delete Staff Member?`}
        </h3>

        {isSuperAdminRoot ? (
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            The primary Super Admin account (ID: 1) is the root owner of the POS & ERP installation and cannot be removed for security and continuity reasons.
          </p>
        ) : (
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Are you sure you want to remove <strong className="text-slate-800">{staff.name}</strong> ({staff.role_name || 'Staff'})? Their login access will be immediately terminated. Previous sales and records assigned to this user will be preserved.
          </p>
        )}

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            {isSuperAdminRoot ? 'Understood' : 'Cancel'}
          </button>
          {!isSuperAdminRoot && (
            <button
              type="button"
              onClick={onConfirm}
              disabled={deleting}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2"
            >
              {deleting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <span>Confirm Delete</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
