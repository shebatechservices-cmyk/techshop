import React from "react";
import StaffAccountsSubTab from "./staff/StaffAccountsSubTab";
import StaffRecoverySubTab from "./staff/StaffRecoverySubTab";
import StaffApprovalsSubTab from "./staff/StaffApprovalsSubTab";

export default function StaffLoginsTab({
  staffSubTab,
  setStaffSubTab,
  filteredUsers = [],
  staffRecoveryRequests = [],
  fetchPendingStaff,
  pendingStaffList = [],
  staffSearch,
  setStaffSearch,
  staffRoleFilter,
  setStaffRoleFilter,
  setIsAddStaffOpen,
  handleOpenEditStaff,
  handleToggleUserLock,
  showToast,
  setStaffToDelete,
  loadStaffRecovery,
  resolvingStaffReqId,
  setResolvingStaffReqId,
  newStaffPassword,
  setNewStaffPassword,
  generate3TypeStaffPassword,
  staffResolutionNotes,
  setStaffResolutionNotes,
  staffRecoveryLoading,
  handleResolveStaffRecovery,
  processingStaffId,
  handleApproveOrRejectStaff,
}) {
  return (
    <div>
      {/* Subtabs for Staff */}
      <div className="flex gap-2 mb-4 border-b border-slate-200 pb-2 flex-wrap">
        <button
          type="button"
          onClick={() => setStaffSubTab("accounts")}
          className={`px-4 py-2 rounded-lg border-0 font-bold text-xs sm:text-sm cursor-pointer transition-colors ${
            staffSubTab === "accounts"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          👥 Staff Accounts ({filteredUsers.length})
        </button>
        <button
          type="button"
          onClick={() => setStaffSubTab("recovery")}
          className={`px-4 py-2 rounded-lg border-0 font-bold text-xs sm:text-sm cursor-pointer flex items-center gap-1.5 transition-colors ${
            staffSubTab === "recovery"
              ? "bg-amber-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <span>📬 Password Recovery Requests</span>
          {staffRecoveryRequests.filter((r) => r.status === "pending").length > 0 && (
            <span className="bg-white text-amber-700 rounded-full px-1.5 py-0.25 text-xs font-extrabold">
              {staffRecoveryRequests.filter((r) => r.status === "pending").length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setStaffSubTab("approvals");
            fetchPendingStaff();
          }}
          className={`px-4 py-2 rounded-lg border-0 font-bold text-xs sm:text-sm cursor-pointer flex items-center gap-1.5 transition-colors ${
            staffSubTab === "approvals"
              ? "bg-sky-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <span>📋 Pending Staff Approvals</span>
          {pendingStaffList.length > 0 && (
            <span className="bg-rose-600 text-white rounded-full px-2 py-0.25 text-xs font-extrabold">
              {pendingStaffList.length}
            </span>
          )}
        </button>
      </div>

      {staffSubTab === "accounts" && (
        <StaffAccountsSubTab
          filteredUsers={filteredUsers}
          staffRecoveryRequests={staffRecoveryRequests}
          staffSearch={staffSearch}
          setStaffSearch={setStaffSearch}
          staffRoleFilter={staffRoleFilter}
          setStaffRoleFilter={setStaffRoleFilter}
          setIsAddStaffOpen={setIsAddStaffOpen}
          setStaffSubTab={setStaffSubTab}
          handleOpenEditStaff={handleOpenEditStaff}
          handleToggleUserLock={handleToggleUserLock}
          showToast={showToast}
          setStaffToDelete={setStaffToDelete}
        />
      )}

      {staffSubTab === "recovery" && (
        <StaffRecoverySubTab
          staffRecoveryRequests={staffRecoveryRequests}
          loadStaffRecovery={loadStaffRecovery}
          resolvingStaffReqId={resolvingStaffReqId}
          setResolvingStaffReqId={setResolvingStaffReqId}
          newStaffPassword={newStaffPassword}
          setNewStaffPassword={setNewStaffPassword}
          generate3TypeStaffPassword={generate3TypeStaffPassword}
          staffResolutionNotes={staffResolutionNotes}
          setStaffResolutionNotes={setStaffResolutionNotes}
          staffRecoveryLoading={staffRecoveryLoading}
          handleResolveStaffRecovery={handleResolveStaffRecovery}
        />
      )}

      {staffSubTab === "approvals" && (
        <StaffApprovalsSubTab
          pendingStaffList={pendingStaffList}
          fetchPendingStaff={fetchPendingStaff}
          processingStaffId={processingStaffId}
          handleApproveOrRejectStaff={handleApproveOrRejectStaff}
        />
      )}
    </div>
  );
}
