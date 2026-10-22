import React from 'react';

export default function StaffContactActivitySection({ staff = {} }) {
  return (
    <div className="space-y-4">
      {/* Contact Details */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <span>📞</span> Contact Information
        </h4>
        <div className="space-y-2 text-xs">
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
              <span className="text-slate-400">🚨 Emergency:</span>
              <span className="font-bold text-slate-700">{staff.emergency_contact}</span>
            </div>
          )}

          {staff.address && (
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block mb-0.5">🏠 Address:</span>
              <span className="text-slate-700 font-medium leading-relaxed">{staff.address}</span>
            </div>
          )}
        </div>
      </div>

      {/* Activity & System Records */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span>⏱️</span> Activity & Records
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[11px]">Last Sign-in</span>
            <span className="font-bold text-slate-700 truncate block">
              {staff.last_login ? new Date(staff.last_login).toLocaleDateString() : 'Never logged in'}
            </span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[11px]">Joined On</span>
            <span className="font-bold text-slate-700 truncate block">
              {staff.created_at ? new Date(staff.created_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {staff.notes && (
        <div className="p-2.5 bg-amber-50/60 border border-amber-200/80 rounded-xl text-xs text-amber-900">
          <span className="font-bold block mb-0.5">📌 Internal Notes:</span>
          <p>{staff.notes}</p>
        </div>
      )}
    </div>
  );
}
