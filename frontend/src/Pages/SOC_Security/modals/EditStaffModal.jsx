import React from "react";
import BDPhoneInput from "../../../components/shared/BDPhoneInput";

export default function EditStaffModal({
  editingStaff,
  onClose,
  setEditingStaff,
  roles = [],
  handleUpdateStaffSubmit,
  generate3TypeStaffPassword,
}) {
  if (!editingStaff) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/65 backdrop-blur-[3px] flex items-center justify-center z-[99999] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="m-0 text-lg font-black text-slate-900">
            ✏️ Edit Staff / Technician Account
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="bg-transparent border-0 text-xl text-slate-400 hover:text-slate-600 cursor-pointer p-1"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleUpdateStaffSubmit}>
          <div className="mb-3">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={editingStaff.name}
              onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
              className="w-full px-2.5 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white text-slate-900 box-border"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <BDPhoneInput
                label="Mobile Number"
                required
                value={editingStaff.phone}
                onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                placeholder="1X-XXXXXXXX"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={editingStaff.email}
                onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                className="w-full px-2.5 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white text-slate-900 box-border"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Assigned Role
              </label>
              <select
                value={editingStaff.role_name}
                onChange={(e) => {
                  const selRole = roles.find((r) => r.name === e.target.value);
                  setEditingStaff({
                    ...editingStaff,
                    role_name: e.target.value,
                    role_id: selRole ? selRole.id : 4,
                  });
                }}
                className="w-full px-2.5 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white text-slate-700"
              >
                <option value="Super Admin">Super Admin</option>
                <option value="Branch Manager">Branch Manager</option>
                <option value="Field Technician">Field Technician</option>
                <option value="Sales Executive">Sales Executive</option>
                <option value="Inventory Officer">Inventory Officer</option>
                <option value="Accountant">Accountant</option>
              </select>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700">
                  New Password
                </label>
                <button
                  type="button"
                  onClick={() => setEditingStaff({ ...editingStaff, password: generate3TypeStaffPassword ? generate3TypeStaffPassword() : "" })}
                  className="bg-transparent border-0 text-sky-600 cursor-pointer text-xs font-bold underline p-0"
                >
                  ⚡ Generate 3-Type
                </button>
              </div>
              <input
                type="text"
                placeholder="Leave blank to keep current"
                value={editingStaff.password}
                onChange={(e) => setEditingStaff({ ...editingStaff, password: e.target.value })}
                className="w-full px-2.5 py-2 rounded-md border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white text-slate-900 box-border"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Hardware Device Binding ID
            </label>
            <input
              type="text"
              placeholder="e.g. DEV-TECH-01 (leave blank for unrestricted)"
              value={editingStaff.device_id}
              onChange={(e) => setEditingStaff({ ...editingStaff, device_id: e.target.value })}
              className="w-full px-2.5 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white text-slate-900 box-border"
            />
          </div>

          <div className="mb-4.5">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Allowed Network IP
            </label>
            <input
              type="text"
              placeholder="e.g. 103.145.118.42 or 'Any IP'"
              value={editingStaff.allowed_ip}
              onChange={(e) => setEditingStaff({ ...editingStaff, allowed_ip: e.target.value })}
              className="w-full px-2.5 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white text-slate-900 box-border"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm cursor-pointer transition-colors border-0"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
