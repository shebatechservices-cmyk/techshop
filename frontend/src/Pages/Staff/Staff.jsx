import React from 'react';
import useStaffManager from './hooks/useStaffManager';
import StaffModal from './modals/StaffModal';
import StaffDetailsModal from './modals/StaffDetailsModal';
import StaffDeleteModal from './modals/StaffDeleteModal';

export default function Staff({ currentUser }) {
  const {
    staffList,
    roles,
    loading,
    saving,
    search,
    setSearch,
    selectedRole,
    setSelectedRole,
    selectedStatus,
    setSelectedStatus,
    viewMode,
    setViewMode,
    stats,
    isModalOpen,
    setIsModalOpen,
    modalMode,
    formData,
    setFormData,
    formErrors,
    isDetailsOpen,
    setIsDetailsOpen,
    selectedStaff,
    isDeleteOpen,
    setIsDeleteOpen,
    deletingStaff,
    deleting,
    toast,
    openCreateModal,
    openEditModal,
    openDetailsModal,
    openDeleteModal,
    handleSaveStaff,
    handleToggleStatus,
    handleDeleteStaff,
    refreshStaff
  } = useStaffManager();

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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-200 ${
          toast.type === 'error'
            ? 'bg-rose-50 text-rose-700 border-rose-200'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }`}>
          <span>{toast.type === 'error' ? '❌' : '✅'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <span>Management</span>
            <span>/</span>
            <span className="text-blue-600 font-bold">Staff & Employees</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <span className="text-2xl">👥</span>
            <span>Staff & Team Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage system users, login credentials, role assignments, designations, and employee payroll.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={refreshStaff}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors text-xs font-bold flex items-center gap-1.5"
            title="Refresh list"
          >
            <span className={loading ? 'animate-spin' : ''}>🔄</span>
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-2"
          >
            <span>➕</span>
            <span>Add New Staff</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Staff</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-800">{stats.totalStaff || 0}</span>
            <span className="text-lg">👥</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Active Employees</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-emerald-600">{stats.activeStaff || 0}</span>
            <span className="text-lg">🟢</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Admins / Managers</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-indigo-700">{stats.adminCount || 0}</span>
            <span className="text-lg">🛡️</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Technicians</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-amber-600">{stats.techCount || 0}</span>
            <span className="text-lg">🔧</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Monthly Payroll</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-xl font-black text-slate-900">
              ৳{(stats.totalMonthlyPayroll || 0).toLocaleString()}
            </span>
            <span className="text-lg">💰</span>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search staff by name, phone, email, designation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-100 bg-slate-50/50"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Badges & View Toggle */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:border-blue-500"
          >
            <option value="all">All Roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden p-0.5 bg-slate-100 ml-auto sm:ml-0">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              ☰ Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Grid Card View"
            >
              ⊞ Cards
            </button>
          </div>
        </div>
      </div>

      {/* Staff List View */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-600">Loading staff directory...</p>
        </div>
      ) : staffList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
          <div className="text-4xl mb-3">👥</div>
          <h3 className="text-base font-bold text-slate-800 mb-1">No Staff Members Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
            {search || selectedRole !== 'all' || selectedStatus !== 'all'
              ? 'No staff members match your active search filters. Try clearing your search or filter options.'
              : 'You have not added any staff members yet. Create your first employee profile.'}
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm inline-flex items-center gap-2"
          >
            <span>➕</span>
            <span>Add First Staff Member</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/90 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Role & Access</th>
                  <th className="py-3 px-4">Contact Details</th>
                  <th className="py-3 px-4">Salary</th>
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
                      <span className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-lg border ${getRoleBadgeColor(staff.role_name)}`}>
                        {staff.role_name}
                      </span>
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

                    {/* Joining Date */}
                    <td className="py-3.5 px-4 text-[11px] text-slate-500">
                      {staff.joining_date ? new Date(staff.joining_date).toLocaleDateString('en-GB') : '—'}
                    </td>

                    {/* Status Toggle Switch */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(staff)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold transition-colors ${
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
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Profile Details"
                        >
                          👁️
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(staff)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit Staff"
                        >
                          ✏️
                        </button>
                        {Number(staff.id) !== 1 && (
                          <button
                            type="button"
                            onClick={() => openDeleteModal(staff)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
      ) : (
        /* GRID CARD VIEW */
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
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
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
                    className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Details
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(staff)}
                    className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Staff Modal (Add / Edit) */}
      <StaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        formData={formData}
        setFormData={setFormData}
        formErrors={formErrors}
        roles={roles}
        saving={saving}
        onSubmit={handleSaveStaff}
      />

      {/* Staff Details Modal */}
      <StaffDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        staff={selectedStaff}
        onEdit={openEditModal}
        onToggleStatus={handleToggleStatus}
      />

      {/* Staff Delete Modal */}
      <StaffDeleteModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        staff={deletingStaff}
        onConfirm={handleDeleteStaff}
        deleting={deleting}
      />
    </div>
  );
}
