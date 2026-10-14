import React from 'react';

export default function StaffAddressFields({
  formData,
  setFormData,
}) {
  return (
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
              {formData.is_active
                ? 'Staff can log in and perform actions.'
                : 'Staff is locked out from signing in.'}
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
  );
}
