import React from "react";

export default function StaffRecoverySubTab({
  staffRecoveryRequests = [],
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
}) {
  return (
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
                req.status === "pending"
                  ? "border-amber-400 shadow-sm shadow-amber-400/10"
                  : "border-slate-200"
              }`}
            >
              <div className="flex justify-between items-start flex-wrap gap-2.5 mb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-900 text-sm">{req.user_name || "Staff Member"}</strong>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-extrabold ${
                        req.status === "pending"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {req.status === "pending" ? "Pending Reset" : "✓ Resolved"}
                    </span>
                  </div>
                  <div className="text-slate-500 text-xs mt-1 flex gap-3.5 flex-wrap">
                    <span>
                      Identifier: <strong className="text-sky-600">{req.identifier}</strong>
                    </span>
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
                        onClick={() => {
                          setResolvingStaffReqId(null);
                          setNewStaffPassword("");
                        }}
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
  );
}
