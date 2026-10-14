import React from "react";

export default function StaffApprovalsSubTab({
  pendingStaffList = [],
  fetchPendingStaff,
  processingStaffId,
  handleApproveOrRejectStaff,
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2.5">
        <div>
          <h4 className="m-0 text-slate-900 text-base font-extrabold">
            📋 Staff &amp; Technician Approvals
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
          <div className="text-slate-500 text-xs mt-1">
            When a new staff member registers, their application will appear here immediately for review.
          </div>
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
                <tr
                  key={st.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="text-base">👤</span>
                      <span>{st.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    <span className="font-mono font-semibold">{st.phone || "N/A"}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{st.email || "—"}</td>
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
                          if (
                            window.confirm(
                              `Are you sure you want to reject registration for ${st.name}?`
                            )
                          ) {
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
  );
}
