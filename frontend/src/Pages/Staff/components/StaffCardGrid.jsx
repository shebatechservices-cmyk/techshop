import React from 'react';
import { getInitials, getRoleBadgeColor } from '../utils/staffHelpers';

export default function StaffCardGrid({
  staffList = [],
  handleToggleStatus = () => {},
  openDetailsModal = () => {},
  openEditModal = () => {}
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {staffList.map((staff) => (
        <div
          key={staff.id}
          className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 font-black flex items-center justify-center text-base flex-shrink-0">
                  {getInitials(staff.name)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{staff.name}</h4>
                  <span className="text-xs text-slate-400">{staff.designation || 'Staff Member'}</span>
                </div>
              </div>
              <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md border ${getRoleBadgeColor(staff.role_name)}`}>
                {staff.role_name}
              </span>
            </div>

            <div className="space-y-1.5 py-3 border-y border-slate-100 text-xs">
              {staff.phone && (
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400">Phone:</span>
                  <span className="font-semibold text-slate-800">{staff.phone}</span>
                </div>
              )}
              {staff.email && (
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400">Email:</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[180px]">{staff.email}</span>
                </div>
              )}
              {staff.salary && (
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400">Salary:</span>
                  <span className="font-bold text-slate-900">৳{parseFloat(staff.salary).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 mt-2">
            <button
              type="button"
              onClick={() => handleToggleStatus(staff)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                staff.is_active
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${staff.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span>{staff.is_active ? 'Active' : 'Inactive'}</span>
            </button>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => openDetailsModal(staff)}
                className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Details
              </button>
              <button
                type="button"
                onClick={() => openEditModal(staff)}
                className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
