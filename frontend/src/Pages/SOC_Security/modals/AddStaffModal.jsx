import React from "react";
import BDPhoneInput from "../../../components/shared/BDPhoneInput";

export default function AddStaffModal({
  isOpen,
  onClose,
  newStaff,
  setNewStaff,
  roles = [],
  handleCreateStaff,
  generate3TypeStaffPassword,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/65 backdrop-blur-[3px] flex items-center justify-center z-[99999] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <h3 className="m-0 mb-4 text-lg font-black text-slate-900">
          + Register Staff / Field Technician
        </h3>
        <form onSubmit={handleCreateStaff}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Al-Amin Technician"
                value={newStaff.name}
                onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                className="w-full px-2.5 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white text-slate-900 box-border"
              />
            </div>
            <div>
              <BDPhoneInput
                label="Mobile Number (Login)"
                required
                value={newStaff.phone}
                onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                placeholder="1X-XXXXXXXX"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address (Optional Login)
              </label>
              <input
                type="email"
                placeholder="e.g. staff@shebatech.com.bd"
                value={newStaff.email}
                onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                className="w-full px-2.5 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white text-slate-900 box-border"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Assigned Role *
              </label>
              <select
                value={newStaff.role_name}
                onChange={(e) => {
                  const rName = e.target.value;
                  const rObj = roles.find((r) => r.name === rName);
                  setNewStaff({
                    ...newStaff,
                    role_name: rName,
                    role_id: rObj ? rObj.id : 4,
                  });
                }}
                className="w-full px-2.5 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white text-slate-700"
              >
                <option value="Field Technician">Field Technician</option>
                <option value="Sales Executive">Sales Executive</option>
                <option value="Branch Manager">Branch Manager</option>
                <option value="Inventory Officer">Inventory Officer</option>
                <option value="Accountant">Accountant</option>
              </select>
            </div>
          </div>

          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700">
                Login Password (3-Type Combination) *
              </label>
              <button
                type="button"
                onClick={() => setNewStaff({ ...newStaff, password: generate3TypeStaffPassword ? generate3TypeStaffPassword() : "" })}
                className="bg-transparent border-0 text-sky-600 cursor-pointer text-xs font-bold underline p-0"
              >
                ⚡ Generate 3-Type Password
              </button>
            </div>
            <input
              type="text"
              required
              placeholder="e.g. Staff@4821! (Letters, Numbers & Special Characters)"
              value={newStaff.password}
              onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
              className="w-full px-2.5 py-2 rounded-md border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white text-slate-900 box-border"
            />
            <div className="text-xs text-slate-500 mt-1">
              Staff will use this password along with their Mobile Number or Email to sign in.
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Hardware Device Binding ID (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. DEV-TECH-MOB-01 (leave blank for unrestricted)"
              value={newStaff.device_id}
              onChange={(e) => setNewStaff({ ...newStaff, device_id: e.target.value })}
              className="w-full px-2.5 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white text-slate-900 box-border"
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Allowed Network IP (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 103.145.118.42 or 'Any IP'"
              value={newStaff.allowed_ip}
              onChange={(e) => setNewStaff({ ...newStaff, allowed_ip: e.target.value })}
              className="w-full px-2.5 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white text-slate-900 box-border"
            />
          </div>

          <div className="mb-4.5">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Opening Wallet Balance (৳)
            </label>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="0.00 (optional wallet balance)"
              value={newStaff.opening_wallet_balance}
              onChange={(e) => setNewStaff({ ...newStaff, opening_wallet_balance: e.target.value })}
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
              className="px-5 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm cursor-pointer transition-colors border-0"
            >
              Register Staff
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
