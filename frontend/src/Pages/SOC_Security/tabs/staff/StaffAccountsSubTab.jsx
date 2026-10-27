import React from "react";
import StaffAccountsTable from "./StaffAccountsTable";

export default function StaffAccountsSubTab({
  filteredUsers = [],
  staffRecoveryRequests = [],
  staffSearch,
  setStaffSearch,
  staffRoleFilter,
  setStaffRoleFilter,
  setIsAddStaffOpen,
  setStaffSubTab,
  handleOpenEditStaff,
  handleToggleUserLock,
  showToast,
  setStaffToDelete,
}) {
  const pendingCount = staffRecoveryRequests.filter((r) => r.status === "pending").length;

  return (
    <div>
      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 sm:px-3.5 mb-3.5 flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2 text-amber-800 text-xs sm:text-sm font-semibold">
            <span>🔔</span>
            <span>{pendingCount} staff member(s) requested password recovery.</span>
          </div>
          <button
            type="button"
            onClick={() => setStaffSubTab("recovery")}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-bold text-xs cursor-pointer border-0 transition-colors"
          >
            Review Requests →
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <div className="flex-1 min-w-[240px] max-w-sm">
          <input
            type="text"
            value={staffSearch}
            onChange={(e) => setStaffSearch(e.target.value)}
            placeholder="🔍 Search staff by name, phone, device ID..."
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white text-slate-900 box-border"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={staffRoleFilter}
            onChange={(e) => setStaffRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          >
            <option value="all">All Roles</option>
            <option value="Super Admin">Super Admin</option>
            <option value="Branch Manager">Branch Manager</option>
            <option value="Field Technician">Field Technician</option>
            <option value="Sales Executive">Sales Executive</option>
            <option value="Inventory Officer">Inventory Officer</option>
            <option value="Accountant">Accountant</option>
          </select>

          <button
            type="button"
            onClick={() => setIsAddStaffOpen(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs sm:text-sm cursor-pointer transition-colors border-0"
          >
            + Add Staff / Technician
          </button>
        </div>
      </div>

      <StaffAccountsTable
        filteredUsers={filteredUsers}
        handleOpenEditStaff={handleOpenEditStaff}
        handleToggleUserLock={handleToggleUserLock}
        showToast={showToast}
        setStaffToDelete={setStaffToDelete}
      />
    </div>
  );
}
