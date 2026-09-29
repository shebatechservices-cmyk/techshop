import React from 'react';
import useStaffManager from './hooks/useStaffManager';
import StaffModal from './modals/StaffModal';
import StaffDetailsModal from './modals/StaffDetailsModal';
import StaffDeleteModal from './modals/StaffDeleteModal';
import StaffHeader from './components/StaffHeader';
import StaffStatsCards from './components/StaffStatsCards';
import StaffToolbar from './components/StaffToolbar';
import StaffTable from './components/StaffTable';
import StaffCardGrid from './components/StaffCardGrid';

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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-200 ${
            toast.type === 'error'
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          <span>{toast.type === 'error' ? '❌' : '✅'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <StaffHeader
        loading={loading}
        refreshStaff={refreshStaff}
        openCreateModal={openCreateModal}
      />

      {/* KPI Stat Cards */}
      <StaffStatsCards stats={stats} />

      {/* Toolbar & Filters */}
      <StaffToolbar
        search={search}
        setSearch={setSearch}
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
        roles={roles}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

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
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm inline-flex items-center gap-2 cursor-pointer"
          >
            <span>➕</span>
            <span>Add First Staff Member</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <StaffTable
          staffList={staffList}
          handleToggleStatus={handleToggleStatus}
          openDetailsModal={openDetailsModal}
          openEditModal={openEditModal}
          openDeleteModal={openDeleteModal}
        />
      ) : (
        <StaffCardGrid
          staffList={staffList}
          handleToggleStatus={handleToggleStatus}
          openDetailsModal={openDetailsModal}
          openEditModal={openEditModal}
        />
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
