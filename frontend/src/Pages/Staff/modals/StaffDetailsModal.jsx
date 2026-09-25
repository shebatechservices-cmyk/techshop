import React from 'react';

export default function StaffDetailsModal({
  isOpen,
  onClose,
  staff,
  onEdit,
  onToggleStatus
}) {
  if (!isOpen || !staff) return null;

  const getRoleBadgeColor = (roleName = '') => {
    const lower = roleName.toLowerCase();
    if (lower.includes('super admin')) return 'bg-purple-100 text-purple-700 border-purple-200';
    if (lower.includes('admin')) return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    if (lower.includes('technician')) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  const getInitials = (name = '') => {
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'ST';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Modal Header & Hero Card */}
        <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 flex items-center justify-center transition-colors text-lg"
          >
            ✕
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/30 border border-blue-400/40 text-blue-200 flex items-center justify-center text-xl font-black shadow-inner">
              {getInitials(staff.name)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="text-lg font-bold text-white">{staff.name}</h3>
                <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md border ${getRoleBadgeColor(staff.role_name)}`}>
                  {staff.role_name}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">{staff.designation || 'Staff Member'}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  staff.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${staff.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                  {staff.is_active ? 'Active Employee' : 'Deactivated'}
                </span>
                <span className="text-[11px] text-slate-400">ID: #{staff.id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Monthly Salary</span>
              <span className="text-base font-extrabold text-slate-800">
                {staff.salary ? `৳${parseFloat(staff.salary).toLocaleString()}` : 'Not Specified'}
              </span>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Joining Date</span>
              <span className="text-xs font-bold text-slate-800">
                {staff.joining_date ? new Date(staff.joining_date).toLocaleDateString('en-GB') : 'N/A'}
              </span>
            </div>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <span>📞</span> Contact Information
            </h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">📱 Phone:</span>
                  <span className="font-bold text-slate-700">{staff.phone || 'None provided'}</span>
                </div>
                {staff.phone && (
                  <a
                    href={`tel:${staff.phone}`}
                    className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[11px] font-semibold hover:bg-blue-100"
                  >
                    Call
                  </a>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">✉️ Email:</span>
                  <span className="font-bold text-slate-700">{staff.email || 'None provided'}</span>
                </div>
                {staff.email && (
                  <a
                    href={`mailto:${staff.email}`}
                    className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[11px] font-semibold hover:bg-blue-100"
                  >
                    Email
                  </a>
                )}
              </div>

              {staff.emergency_contact && (
                <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400">🚨 Emergency Contact:</span>
                  <span className="font-bold text-slate-700">{staff.emergency_contact}</span>
                </div>
              )}

              {staff.address && (
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-1">🏠 Address:</span>
                  <span className="text-slate-700 font-medium leading-relaxed">{staff.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Account Details & Activity */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <span>⏱️</span> Activity & System Records
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Last Sign-in</span>
                <span className="font-bold text-slate-700">
                  {staff.last_login ? new Date(staff.last_login).toLocaleString() : 'Never logged in'}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Account Created</span>
                <span className="font-bold text-slate-700">
                  {staff.created_at ? new Date(staff.created_at).toLocaleDateString('en-GB') : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {staff.notes && (
            <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-xs text-amber-900">
              <span className="font-bold block mb-0.5">📌 Internal Notes:</span>
              <p>{staff.notes}</p>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/80">
          <button
            type="button"
            onClick={() => onToggleStatus(staff)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              staff.is_active
                ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
            }`}
          >
            {staff.is_active ? 'Deactivate Account' : 'Activate Account'}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(staff);
              }}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
            >
              Edit Staff
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
