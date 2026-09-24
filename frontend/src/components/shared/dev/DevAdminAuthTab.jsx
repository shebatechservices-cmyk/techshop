import React from 'react';

export default function DevAdminAuthTab({
  adminCreds,
  setAdminCreds,
  adminRecoveryRequests,
  adminActionLoading,
  resettingReqId,
  setResettingReqId,
  newAdminPassword,
  setNewAdminPassword,
  devNotes,
  setDevNotes,
  handleSaveAdminCreds,
  handleResolveAdminRecovery,
  generate3TypePassword,
}) {
  return (
    <div className="flex flex-col gap-5 text-xs font-mono">
      {/* Box 1: App Admin Credentials */}
      <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2.5">
          <div>
            <h3 className="text-sm font-bold text-sky-400 flex items-center gap-2 m-0">
              <span>🔐</span> App User Admin Credentials (Master Account)
            </h3>
            <p className="text-slate-400 text-xs mt-1 mb-0">
              Developer manages the first-time App Admin account. Saved dynamically to Cloud Database. Admin can log in using either Mobile or Email.
            </p>
          </div>
          <span className={`py-1 px-3 rounded-full text-[11px] font-bold border ${adminCreds.is_active ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40' : 'bg-rose-500/15 text-rose-400 border-rose-500/40'}`}>
            {adminCreds.is_active ? '● Account Active' : '○ Account Suspended'}
          </span>
        </div>

        <form onSubmit={handleSaveAdminCreds} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-slate-300 text-[11px] mb-1 font-semibold">
              Admin Full Name
            </label>
            <input
              type="text"
              value={adminCreds.name}
              onChange={(e) => setAdminCreds({ ...adminCreds, name: e.target.value })}
              placeholder="e.g. Sheba Technology Admin"
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-[11px] mb-1 font-semibold">
              Mobile Number (Login Identifier)
            </label>
            <input
              type="text"
              value={adminCreds.phone}
              onChange={(e) => setAdminCreds({ ...adminCreds, phone: e.target.value })}
              placeholder="e.g. 01700000000"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-[11px] mb-1 font-semibold">
              Email Address (Login Identifier)
            </label>
            <input
              type="email"
              value={adminCreds.email}
              onChange={(e) => setAdminCreds({ ...adminCreds, email: e.target.value })}
              placeholder="e.g. shebatechservices@gmail.com"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-300 text-[11px] font-semibold">
                Admin Password
              </label>
              <button
                type="button"
                onClick={() => setAdminCreds({ ...adminCreds, password: generate3TypePassword() })}
                className="text-sky-400 hover:underline text-[11px] font-semibold"
              >
                ⚡ Generate 3-Type
              </button>
            </div>
            <input
              type="text"
              value={adminCreds.password}
              onChange={(e) => setAdminCreds({ ...adminCreds, password: e.target.value })}
              placeholder="Min 6 chars (Letters, Numbers, Symbols)"
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-amber-300 font-mono outline-none focus:border-sky-500"
            />
          </div>

          <div className="col-span-full flex items-center justify-between pt-2 border-t border-slate-800 flex-wrap gap-3">
            <label className="inline-flex items-center gap-2 cursor-pointer text-slate-300 text-xs select-none">
              <input
                type="checkbox"
                checked={adminCreds.is_active}
                onChange={(e) => setAdminCreds({ ...adminCreds, is_active: e.target.checked })}
                className="w-4 h-4 accent-sky-600 rounded"
              />
              Permit App User Admin Login (Active Status)
            </label>

            <button
              type="submit"
              disabled={adminActionLoading}
              className="py-2 px-5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"
            >
              {adminActionLoading ? 'Saving to Database...' : '💾 Save Admin Credentials to DB'}
            </button>
          </div>
        </form>
      </div>

      {/* Box 2: Admin Password Recovery Requests */}
      <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-5 shadow-sm">
        <div className="flex justify-between items-center mb-3.5 flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2 m-0">
              <span>📬</span> App Admin Recovery Notifications ({adminRecoveryRequests.length})
            </h3>
            <p className="text-slate-400 text-xs mt-1 mb-0">
              Review and approve reset requests received from the Login Screen.
            </p>
          </div>
        </div>

        {adminRecoveryRequests.length === 0 ? (
          <p className="text-slate-500 text-xs text-center py-4">No pending admin recovery requests.</p>
        ) : (
          <div className="space-y-2.5">
            {adminRecoveryRequests.map((req) => (
              <div key={req.id} className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex justify-between items-center flex-wrap gap-2">
                <div>
                  <div className="font-bold text-slate-200">Request #{req.id} • {req.identifier}</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">Role: {req.user_type || 'admin'} • Requested at: {new Date(req.created_at).toLocaleString()}</div>
                  {req.reason && <div className="text-slate-500 text-[11px] italic">Note: {req.reason}</div>}
                </div>
                {resettingReqId === req.id ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="text"
                      placeholder="New password"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-amber-300 font-mono text-xs outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleResolveAdminRecovery(req.id)}
                      disabled={adminActionLoading}
                      className="py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
                    >
                      ✓ Apply & Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setResettingReqId(null)}
                      className="py-1 px-2.5 bg-slate-800 text-slate-400 rounded-lg text-xs font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setResettingReqId(req.id);
                      setNewAdminPassword(generate3TypePassword());
                    }}
                    className="py-1 px-3 bg-amber-600/20 border border-amber-500/40 text-amber-300 hover:bg-amber-600/30 rounded-lg text-xs font-bold transition-colors"
                  >
                    🔑 Reset & Approve
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
