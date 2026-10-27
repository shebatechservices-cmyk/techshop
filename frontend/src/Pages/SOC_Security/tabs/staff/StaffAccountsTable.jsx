import React from "react";
import StaffAccountRow from "./StaffAccountRow";

export default function StaffAccountsTable({
  filteredUsers = [],
  handleOpenEditStaff,
  handleToggleUserLock,
  showToast,
  setStaffToDelete,
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="bg-slate-900 text-white text-xs font-extrabold tracking-wider">
            <th className="px-3.5 py-2.5">STAFF / TECHNICIAN</th>
            <th className="px-3.5 py-2.5">ROLE</th>
            <th className="px-3.5 py-2.5">PHONE &amp; LOGIN</th>
            <th className="px-3.5 py-2.5">BOUND DEVICE ID</th>
            <th className="px-3.5 py-2.5">ALLOWED NETWORK</th>
            <th className="px-3.5 py-2.5 text-center">STATUS</th>
            <th className="px-3.5 py-2.5 text-center w-48">ACCESS CONTROLS</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-8 text-slate-400 text-xs sm:text-sm">
                No staff members found matching criteria.
              </td>
            </tr>
          ) : (
            filteredUsers.map((u, idx) => (
              <StaffAccountRow
                key={u.id}
                user={u}
                index={idx}
                handleOpenEditStaff={handleOpenEditStaff}
                handleToggleUserLock={handleToggleUserLock}
                showToast={showToast}
                setStaffToDelete={setStaffToDelete}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
