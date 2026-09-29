import React from 'react';
import { getInitials } from '../utils/staffHelpers';

export default function StaffTable({
  staffList = [],
  handleToggleStatus = () => {},
  openDetailsModal = () => {},
  openEditModal = () => {},
  openDeleteModal = () => {}
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50/90 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200/80">
            <tr>
              <th className="py-3 px-4">Staff Member</th>
              <th className="py-3 px-4">Role & Access</th>
              <th className="py-3 px-4">Contact Details</th>
              <th className="py-3 px-4">Salary</th>
              <th className="py-3 px-4">Wallet (৳)</th>
              <th className="py-3 px-4">Joining Date</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {staffList.map((staff) => (
              <tr key={staff.id} className="hover:bg-slate-50/60 transition-colors">
                {/* Name & Avatar */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-black flex items-center justify-center text-xs flex-shrink-0">
                      {getInitials(staff.name)}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">{staff.name}</span>
                      <span className="text-[11px] text-slate-400 block">{staff.designation || 'Staff'}</span>
                    </div>
                  </div>
                </td>

                {/* Role */}
                <td className="py-3.5 px-4">
                  <div className="flex flex-col gap-1 items-start">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-black rounded uppercase tracking-wider ${
                        (staff.role || '').toUpperCase() === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800'
                          : (staff.role || '').toUpperCase() === 'TECHNICIAN'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {staff.role ||
                        (staff.role_name?.toLowerCase().includes('admin')
                          ? 'ADMIN'
                          : staff.role_name?.toLowerCase().includes('tech')
                          ? 'TECHNICIAN'
                          : 'STAFF')}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">{staff.role_name}</span>
                  </div>
                </td>

                {/* Contact */}
                <td className="py-3.5 px-4">
                  <div className="space-y-0.5 text-[11px]">
                    {staff.phone && (
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <span>📱</span>
                        <span>{staff.phone}</span>
                      </div>
                    )}
                    {staff.email && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <span>✉️</span>
                        <span>{staff.email}</span>
                      </div>
                    )}
                    {!staff.phone && !staff.email && (
                      <span className="text-slate-400 italic">No contact provided</span>
                    )}
                  </div>
                </td>

                {/* Salary */}
                <td className="py-3.5 px-4 font-bold text-slate-800">
                  {staff.salary ? `৳${parseFloat(staff.salary).toLocaleString()}` : '—'}
                </td>

                {/* Personal Wallet */}
                <td className="py-3.5 px-4 font-bold text-emerald-700">
                  ৳{parseFloat(staff.wallet_balance || 0).toLocaleString()}
                </td>

                {/* Joining Date */}
                <td className="py-3.5 px-4 text-[11px] text-slate-500">
                  {staff.joining_date ? new Date(staff.joining_date).toLocaleDateString('en-GB') : '—'}
                </td>

                {/* Status Toggle Switch */}
                <td className="py-3.5 px-4 text-center">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(staff)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                      staff.is_active
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                    }`}
                    title={staff.is_active ? 'Click to deactivate' : 'Click to activate'}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${staff.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span>{staff.is_active ? 'Active' : 'Inactive'}</span>
                  </button>
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => openDetailsModal(staff)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="View Profile Details"
                    >
                      👁️
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(staff)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit Staff"
                    >
                      ✏️
                    </button>
                    {Number(staff.id) !== 1 && (
                      <button
                        type="button"
                        onClick={() => openDeleteModal(staff)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove Staff"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
