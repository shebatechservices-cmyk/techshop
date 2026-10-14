import React, { useState } from 'react';

export default function StaffRoleSecurityFields({
  formData,
  setFormData,
  formErrors,
  roles = [],
  isEdit,
}) {
  const [showPassword, setShowPassword] = useState(false);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: pass }));
    setShowPassword(true);
  };

  return (
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
            { role: 'TECHNICIAN', label: 'Technician', icon: '🔧', desc: 'Projects, Stock & Wallet' },
          ].map((item) => {
            const isSelected = (formData.role || 'STAFF') === item.role;
            return (
              <button
                key={item.role}
                type="button"
                onClick={() => {
                  let matchingRoleId = 3;
                  if (item.role === 'ADMIN') {
                    matchingRoleId =
                      roles.find((r) => r.name.toLowerCase().includes('admin'))?.id || 1;
                  } else if (item.role === 'TECHNICIAN') {
                    matchingRoleId =
                      roles.find((r) => r.name.toLowerCase().includes('tech'))?.id || 4;
                  } else {
                    matchingRoleId =
                      roles.find(
                        (r) =>
                          !r.name.toLowerCase().includes('admin') &&
                          !r.name.toLowerCase().includes('tech')
                      )?.id || 3;
                  }
                  setFormData({
                    ...formData,
                    role: item.role,
                    role_id: matchingRoleId,
                    designation:
                      formData.designation ||
                      (item.role === 'TECHNICIAN'
                        ? 'Field Technician'
                        : item.role === 'ADMIN'
                        ? 'Shop Admin'
                        : 'Sales Executive'),
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
            onChange={(e) =>
              setFormData({ ...formData, role_id: parseInt(e.target.value, 10) })
            }
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
                formErrors.password
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100 text-slate-800'
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
          {formErrors.password && (
            <p className="text-rose-500 text-xs mt-1 font-medium">{formErrors.password}</p>
          )}
        </div>
      </div>
    </div>
  );
}
