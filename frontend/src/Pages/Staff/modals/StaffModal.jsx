import React from 'react';
import StaffCustomerImport from './staff/StaffCustomerImport';
import StaffPersonalFields from './staff/StaffPersonalFields';
import StaffRoleSecurityFields from './staff/StaffRoleSecurityFields';
import StaffCompensationFields from './staff/StaffCompensationFields';
import StaffAddressFields from './staff/StaffAddressFields';

export default function StaffModal({
  isOpen,
  onClose,
  mode, // 'create' | 'edit'
  formData,
  setFormData,
  formErrors,
  roles = [],
  saving,
  onSubmit,
}) {
  if (!isOpen) return null;

  const isEdit = mode === 'edit';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 sm:px-7 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold">
              {isEdit ? '✏️' : '👤'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isEdit ? `Edit Staff: ${formData.name || 'Member'}` : 'Add New Staff Member'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEdit
                  ? 'Update staff profile, role credentials, and salary details.'
                  : 'Create login credentials and assign system access permissions.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-6">
          {formErrors.submit && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{formErrors.submit}</span>
            </div>
          )}

          {/* Quick Import from Customer (Only on Create mode) */}
          <StaffCustomerImport
            isEdit={isEdit}
            setFormData={setFormData}
          />

          {/* Personal & Account Information */}
          <StaffPersonalFields
            formData={formData}
            setFormData={setFormData}
            formErrors={formErrors}
          />

          {/* Role & Access Security */}
          <StaffRoleSecurityFields
            formData={formData}
            setFormData={setFormData}
            formErrors={formErrors}
            roles={roles}
            isEdit={isEdit}
          />

          {/* Employment & Compensation */}
          <StaffCompensationFields
            formData={formData}
            setFormData={setFormData}
          />

          {/* Additional Details */}
          <StaffAddressFields
            formData={formData}
            setFormData={setFormData}
          />
        </form>

        {/* Modal Footer */}
        <div className="px-6 sm:px-7 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/80">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>{isEdit ? 'Save Changes' : 'Create Staff Member'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
