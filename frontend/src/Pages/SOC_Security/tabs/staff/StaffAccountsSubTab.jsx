import React from "react";

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
  return (
    <div>
      {staffRecoveryRequests.some((r) => r.status === "pending") && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 sm:px-3.5 mb-3.5 flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2 text-amber-800 text-xs sm:text-sm font-semibold">
            <span>🔔</span>
            <span>
              {staffRecoveryRequests.filter((r) => r.status === "pending").length} staff
              member(s) requested password recovery.
            </span>
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

      {/* Staff Table */}
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
            {filteredUsers.map((u, idx) => {
              const roleBadgeClass =
                u.role_name === "Super Admin"
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : u.role_name === "Branch Manager"
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                  : u.role_name === "Sales Executive"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : u.role_name === "Field Technician"
                  ? "bg-sky-50 text-sky-700 border-sky-200"
                  : u.role_name === "Inventory Officer"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : u.role_name === "Accountant"
                  ? "bg-purple-50 text-purple-700 border-purple-200"
                  : "bg-slate-100 text-slate-600 border-slate-200";

              return (
                <tr
                  key={u.id}
                  className={`border-b border-slate-100 ${
                    idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                  } hover:bg-slate-50 transition-colors`}
                >
                  <td className="px-3.5 py-3">
                    <div className="font-bold text-slate-900">{u.name}</div>
                    {u.email && <div className="text-xs text-slate-500">{u.email}</div>}
                  </td>

                  <td className="px-3.5 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-extrabold border ${roleBadgeClass}`}
                    >
                      {u.role_name}
                    </span>
                  </td>

                  <td className="px-3.5 py-3 text-slate-700">
                    <div>📞 {u.phone}</div>
                    <div className="text-xs text-slate-500">
                      Last Login:{" "}
                      {u.last_login
                        ? new Date(u.last_login).toLocaleString("en-GB")
                        : "Active Today"}
                    </div>
                  </td>

                  <td className="px-3.5 py-3">
                    {u.device_id ? (
                      <span className="text-xs text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded font-semibold">
                        📱 {u.device_id}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">Unrestricted Device</span>
                    )}
                  </td>

                  <td className="px-3.5 py-3 text-xs text-slate-600">
                    {u.allowed_ip === "Any IP" ? (
                      <span>🌐 Any IP</span>
                    ) : (
                      <span className="font-mono text-emerald-700 font-semibold">
                        🔒 {u.allowed_ip}
                      </span>
                    )}
                  </td>

                  <td className="px-3.5 py-3 text-center">
                    {u.is_locked ? (
                      <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-rose-100 text-rose-700 border border-rose-200">
                        🔒 LOCKED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-emerald-100 text-emerald-700 border border-emerald-200">
                        ✓ ACTIVE
                      </span>
                    )}
                  </td>

                  <td className="px-3.5 py-3 text-center">
                    <div className="flex justify-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleOpenEditStaff(u)}
                        className="px-2 py-1 rounded border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold cursor-pointer transition-colors"
                        title="Edit Staff / Technician Details"
                      >
                        ✏️ Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleUserLock(u)}
                        className={`px-2 py-1 rounded text-xs font-bold cursor-pointer transition-colors ${
                          u.is_locked
                            ? "border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                            : "border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700"
                        }`}
                      >
                        {u.is_locked ? "🔓 Unlock" : "🔒 Lock"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const newPin = prompt(
                            `Set new 6-digit PIN/password for ${u.name}:`,
                            "123456"
                          );
                          if (newPin) {
                            handleOpenEditStaff({ ...u, password: newPin });
                            showToast(`Enter updated PIN for ${u.name} in Edit modal`);
                          }
                        }}
                        className="px-2 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        🔑 PIN
                      </button>

                      {u.id !== 1 && (
                        <button
                          type="button"
                          onClick={() => setStaffToDelete(u)}
                          className="px-2 py-1 rounded border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold cursor-pointer transition-colors"
                          title="Delete Staff / Technician"
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
