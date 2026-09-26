import React from "react";

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
            staffSubTab === "accounts" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          👥 Staff Accounts ({filteredUsers.length})
        </button>
        <button
          type="button"
          onClick={() => setStaffSubTab("recovery")}
          className={`px-4 py-2 rounded-lg border-0 font-bold text-xs sm:text-sm cursor-pointer flex items-center gap-1.5 transition-colors ${
            staffSubTab === "recovery" ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
          onClick={() => { setStaffSubTab("approvals"); fetchPendingStaff(); }}
          className={`px-4 py-2 rounded-lg border-0 font-bold text-xs sm:text-sm cursor-pointer flex items-center gap-1.5 transition-colors ${
            staffSubTab === "approvals" ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
        <div>
          {staffRecoveryRequests.some((r) => r.status === "pending") && (
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 sm:px-3.5 mb-3.5 flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-2 text-amber-800 text-xs sm:text-sm font-semibold">
                <span>🔔</span>
                <span>{staffRecoveryRequests.filter((r) => r.status === "pending").length} staff member(s) requested password recovery.</span>
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
                    <tr key={u.id} className={`border-b border-slate-100 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"} hover:bg-slate-50 transition-colors`}>
                      <td className="px-3.5 py-3">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        {u.email && <div className="text-xs text-slate-500">{u.email}</div>}
                      </td>

                      <td className="px-3.5 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-extrabold border ${roleBadgeClass}`}>
                          {u.role_name}
                        </span>
                      </td>

                      <td className="px-3.5 py-3 text-slate-700">
                        <div>📞 {u.phone}</div>
                        <div className="text-xs text-slate-500">
                          Last Login: {u.last_login ? new Date(u.last_login).toLocaleString("en-GB") : "Active Today"}
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
                              const newPin = prompt(`Set new 6-digit PIN/password for ${u.name}:`, "123456");
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
      )}

      {/* Staff Password Recovery Requests Subtab */}
      {staffSubTab === "recovery" && (
        <div>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2.5">
            <div>
              <h4 className="m-0 text-slate-900 text-base font-extrabold">
                📬 Staff Password Recovery Requests
              </h4>
              <p className="mt-1 mb-0 text-slate-500 text-xs">
                When staff forget their password or mobile/email login, they send a recovery request to App Admin. Admin can verify and reset their credentials here.
              </p>
            </div>
            <button
              type="button"
              onClick={loadStaffRecovery}
              className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-md text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
            >
              🔄 Refresh
            </button>
          </div>

          {staffRecoveryRequests.length === 0 ? (
            <div className="text-center py-12 px-5 bg-white rounded-xl border border-dashed border-slate-300 shadow-sm">
              <div className="text-3xl mb-2">🛡️</div>
              <div className="font-bold text-slate-800 text-sm">No Recovery Requests</div>
              <div className="text-slate-500 text-xs mt-1">All staff credentials are secure and active.</div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {staffRecoveryRequests.map((req) => (
                <div
                  key={req.id}
                  className={`bg-white rounded-xl p-4 sm:p-5 border ${
                    req.status === "pending" ? "border-amber-400 shadow-sm shadow-amber-400/10" : "border-slate-200"
                  }`}
                >
                  <div className="flex justify-between items-start flex-wrap gap-2.5 mb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 text-sm">{req.user_name || "Staff Member"}</strong>
                        <span className={`px-2 py-0.5 rounded text-xs font-extrabold ${
                          req.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {req.status === "pending" ? "Pending Reset" : "✓ Resolved"}
                        </span>
                      </div>
                      <div className="text-slate-500 text-xs mt-1 flex gap-3.5 flex-wrap">
                        <span>Identifier: <strong className="text-sky-600">{req.identifier}</strong></span>
                        {req.contact_phone && <span>Contact: <strong>{req.contact_phone}</strong></span>}
                        {req.shop_name && <span>Shop: <strong>{req.shop_name}</strong></span>}
                      </div>
                    </div>
                    <div className="text-slate-400 text-xs">
                      {new Date(req.created_at).toLocaleString()}
                    </div>
                  </div>

                  {req.reason && (
                    <div className="bg-slate-50 p-2.5 sm:px-3.5 rounded-md text-xs text-slate-700 mb-3 border border-slate-100">
                      <span className="font-bold text-amber-600">Staff Message: </span>
                      {req.reason}
                    </div>
                  )}

                  {req.status === "pending" ? (
                    resolvingStaffReqId === req.id ? (
                      <div className="bg-slate-50 p-3.5 rounded-lg border border-sky-500 mt-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                          <div>
                            <div className="flex justify-between mb-1">
                              <label className="text-xs font-bold text-slate-700">New 3-Type Password</label>
                              <button
                                type="button"
                                onClick={() => setNewStaffPassword(generate3TypeStaffPassword())}
                                className="bg-transparent border-0 text-sky-600 cursor-pointer text-xs font-semibold underline p-0"
                              >
                                ⚡ Generate 3-Type
                              </button>
                            </div>
                            <input
                              type="text"
                              value={newStaffPassword}
                              onChange={(e) => setNewStaffPassword(e.target.value)}
                              placeholder="Enter or generate new password"
                              className="w-full px-2.5 py-2 border border-slate-300 rounded-md text-slate-900 font-mono text-sm box-border bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Admin Notes</label>
                            <input
                              type="text"
                              value={staffResolutionNotes}
                              onChange={(e) => setStaffResolutionNotes(e.target.value)}
                              placeholder="e.g. Identity verified"
                              className="w-full px-2.5 py-2 border border-slate-300 rounded-md text-slate-900 text-sm box-border bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => { setResolvingStaffReqId(null); setNewStaffPassword(""); }}
                            className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md text-xs font-semibold cursor-pointer border-0 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={staffRecoveryLoading}
                            onClick={() => handleResolveStaffRecovery(req.id)}
                            className="px-4.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-md font-bold text-xs cursor-pointer border-0 transition-colors"
                          >
                            {staffRecoveryLoading ? "Updating Password..." : "✓ Set New Password for Staff"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setResolvingStaffReqId(req.id);
                            setNewStaffPassword(generate3TypeStaffPassword());
                          }}
                          className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-bold text-xs cursor-pointer border-0 transition-colors"
                        >
                          🔑 Reset Staff Password
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="text-xs text-emerald-700 font-semibold">
                      ✓ Resolved by {req.resolved_by || "App Admin"} at {new Date(req.resolved_at).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Staff Self-Registration Approval Subtab */}
      {staffSubTab === "approvals" && (
        <div>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2.5">
            <div>
              <h4 className="m-0 text-slate-900 text-base font-extrabold">
                📋 Staff & Technician Approvals
              </h4>
              <p className="mt-1 mb-0 text-slate-500 text-xs">
                List of staff and technicians registered via online sign-up. Once approved by the shop administrator, they will be granted system access.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchPendingStaff}
              className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-md text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
            >
              🔄 Refresh List
            </button>
          </div>

          {pendingStaffList.length === 0 ? (
            <div className="text-center py-12 px-5 bg-white rounded-xl border border-dashed border-slate-300 shadow-sm">
              <div className="text-3xl mb-2">✅</div>
              <div className="font-bold text-slate-800 text-sm">No Pending Registrations</div>
              <div className="text-slate-500 text-xs mt-1">When a new staff member registers, their application will appear here immediately for review.</div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Phone Number</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Applied Role</th>
                    <th className="px-4 py-3">Registration Date</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingStaffList.map((st) => (
                    <tr key={st.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="text-base">👤</span>
                          <span>{st.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <span className="font-mono font-semibold">{st.phone || "N/A"}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {st.email || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-xs font-bold">
                          {st.role_name || "Field Technician"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {st.created_at ? new Date(st.created_at).toLocaleString() : "Recent"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            type="button"
                            disabled={processingStaffId === st.id}
                            onClick={() => handleApproveOrRejectStaff(st.id, "approve")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 px-3 py-1.5 rounded-md font-bold text-xs cursor-pointer flex items-center gap-1 transition-colors"
                          >
                            <span>✓</span>
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            disabled={processingStaffId === st.id}
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to reject registration for ${st.name}?`)) {
                                handleApproveOrRejectStaff(st.id, "reject");
                              }
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white border-0 px-3 py-1.5 rounded-md font-bold text-xs cursor-pointer flex items-center gap-1 transition-colors"
                          >
                            <span>✕</span>
                            <span>Reject</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
