import React, { useState } from 'react';

export default function StaffModal({
  isOpen,
  onClose,
  mode, // 'create' | 'edit'
  formData,
  setFormData,
  formErrors,
  roles,
  saving,
  onSubmit
}) {
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const isEdit = mode === 'edit';

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password: pass });
    setShowPassword(true);
  };

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
                {isEdit ? 'Update staff profile, role credentials, and salary details.' : 'Create login credentials and assign system access permissions.'}
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

          {/* Basic Info Section */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span>🪪</span> Personal & Account Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tanvir Ahmed"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
                    formErrors.name ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100 text-slate-800'
                  }`}
                />
                {formErrors.name && <p className="text-rose-500 text-xs mt-1 font-medium">{formErrors.name}</p>}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Phone Number <span className="text-slate-400 text-xs">(Login & SMS)</span>
                </label>
                <input
                  type="text"
                  placeholder="017XXXXXXXX"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-100 text-slate-800"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="staff@sheba.technology"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-100 text-slate-800"
                />
              </div>

              {formErrors.contact && (
                <div className="sm:col-span-2">
                  <p className="text-rose-500 text-xs font-medium">{formErrors.contact}</p>
                </div>
              )}
            </div>
          </div>

          {/* Role & Access Security */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span>🛡️</span> Role & Security Credentials
            </h4>

            {/* Role Enum Buttons */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                System Access Role <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { role: 'ADMIN', label: 'Admin', icon: '👑', desc: 'Full System Control' },
                  { role: 'STAFF', label: 'Staff', icon: '💼', desc: 'POS & Store Operations' },
                  { role: 'TECHNICIAN', label: 'Technician', icon: '🔧', desc: 'Projects, Stock & Wallet' }
                ].map((item) => {
                  const isSelected = (formData.role || 'STAFF') === item.role;
                  return (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => {
                        let matchingRoleId = 3;
                        if (item.role === 'ADMIN') matchingRoleId = roles.find(r => r.name.toLowerCase().includes('admin'))?.id || 1;
                        else if (item.role === 'TECHNICIAN') matchingRoleId = roles.find(r => r.name.toLowerCase().includes('tech'))?.id || 4;
                        else matchingRoleId = roles.find(r => !r.name.toLowerCase().includes('admin') && !r.name.toLowerCase().includes('tech'))?.id || 3;
                        setFormData({
                          ...formData,
                          role: item.role,
                          role_id: matchingRoleId,
                          designation: formData.designation || (item.role === 'TECHNICIAN' ? 'Field Technician' : item.role === 'ADMIN' ? 'Shop Admin' : 'Sales Executive')
                        });
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-1 ring-blue-600'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-tight">{item.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Detailed Role Title */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Role Title / Permission Group
                </label>
                <select
                  value={formData.role_id || 3}
                  onChange={(e) => setFormData({ ...formData, role_id: parseInt(e.target.value, 10) })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-100 text-slate-800"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-bold text-slate-700">
                    {isEdit ? 'New Password (Optional)' : 'Login Password *'}
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold hover:underline cursor-pointer"
                  >
                    ⚡ Auto-Generate
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={isEdit ? 'Leave blank to keep current' : 'Min. 4 characters'}
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm pr-12 focus:outline-none focus:ring-2 ${
                      formErrors.password ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100 text-slate-800'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1.5 py-0.5"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {formErrors.password && <p className="text-rose-500 text-xs mt-1 font-medium">{formErrors.password}</p>}
              </div>
            </div>
          </div>

          {/* Employment & Compensation */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span>💼</span> Job Role, Payroll & Wallet
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Designation */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Designation / Job Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Field Technician"
                  value={formData.designation || ''}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-100 text-slate-800"
                />
              </div>

              {/* Monthly Salary */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Monthly Salary (৳)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.salary || ''}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-100 text-slate-800"
                />
              </div>

              {/* Wallet Balance */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Personal Wallet (৳)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.wallet_balance !== undefined ? formData.wallet_balance : ''}
                  onChange={(e) => setFormData({ ...formData, wallet_balance: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-emerald-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-emerald-500 focus:ring-emerald-100 bg-emerald-50/30 font-semibold text-emerald-900"
                />
              </div>

              {/* Joining Date */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Joining Date
                </label>
                <input
                  type="date"
                  value={formData.joining_date || ''}
                  onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-100 text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span>📍</span> Contact & Address
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Emergency Contact */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Emergency Contact Number
                </label>
                <input
                  type="text"
                  placeholder="01XXXXXXXXX (Family / Guardian)"
                  value={formData.emergency_contact || ''}
                  onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-100 text-slate-800"
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-3 pt-6">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.is_active)}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
                <div>
                  <span className="text-sm font-bold text-slate-800">
                    {formData.is_active ? 'Account Active' : 'Account Deactivated'}
                  </span>
                  <p className="text-xs text-slate-400">
                    {formData.is_active ? 'Staff can log in and perform actions.' : 'Staff is locked out from signing in.'}
                  </p>
                </div>
              </div>

              {/* Present Address */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Present Address & Notes
                </label>
                <textarea
                  rows="2"
                  placeholder="Home address, NID info, or internal notes..."
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-100 text-slate-800"
                />
              </div>
            </div>
          </div>
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
