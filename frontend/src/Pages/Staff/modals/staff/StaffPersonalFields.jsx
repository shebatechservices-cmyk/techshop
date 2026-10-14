import React from 'react';
import BangladeshiPhoneInput from '../../../../components/ui/BangladeshiPhoneInput';

export default function StaffPersonalFields({
  formData,
  setFormData,
  formErrors,
}) {
  return (
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
              formErrors.name
                ? 'border-rose-400 focus:ring-rose-200'
                : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100 text-slate-800'
            }`}
          />
          {formErrors.name && (
            <p className="text-rose-500 text-xs mt-1 font-medium">{formErrors.name}</p>
          )}
        </div>

        {/* Phone Number */}
        <div>
          <BangladeshiPhoneInput
            label="Phone Number"
            helperText="(Primary Login & SMS)"
            placeholder="1X-XXXXXXXX"
            value={formData.phone || ''}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
  );
}
