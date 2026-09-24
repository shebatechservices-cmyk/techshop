import React from 'react';

export default function DevUsersTab({
  usersList,
  fetchUsersList,
  showAddUserModal,
  setShowAddUserModal,
  editingUser,
  setEditingUser,
  userActionLoading,
  newUserForm,
  setNewUserForm,
  handleCreateUser,
  handleSaveEditUser,
  handleDeleteUser,
  handleBypassLogin,
}) {
  return (
    <div className="flex flex-col gap-4 text-xs font-mono">
      <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-sky-400 flex items-center gap-2 m-0">
              <span>👥</span> App User & Staff Accounts Master List ({usersList.length})
            </h3>
            <p className="text-slate-400 text-xs mt-1 mb-0">
              Manage accounts, reset passwords, change roles, and launch instant 1-click token bypass logins.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={fetchUsersList}
              className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 font-bold transition-colors"
            >
              🔄 Refresh
            </button>
            <button
              type="button"
              onClick={() => setShowAddUserModal(true)}
              className="py-1.5 px-3.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold transition-colors flex items-center gap-1"
            >
              ➕ Add User
            </button>
          </div>
        </div>

        {usersList.length === 0 ? (
          <p className="text-slate-500 text-xs text-center py-6">No users found in database.</p>
        ) : (
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="p-3">#</th>
                  <th className="p-3">User Name</th>
                  <th className="p-3">Contact (Email / Phone)</th>
                  <th className="p-3">Role</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-bold text-slate-500">#{u.id}</td>
                    <td className="p-3 font-bold text-slate-200">{u.name}</td>
                    <td className="p-3 text-slate-400">
                      <div>{u.email || '—'}</div>
                      <div className="text-[11px] text-slate-500">{u.phone || '—'}</div>
                    </td>
                    <td className="p-3">
                      <span className="bg-slate-800 border border-slate-700 text-sky-300 px-2 py-0.5 rounded text-[11px] font-bold">
                        {u.role_name || (u.role_id === 1 ? 'Super Admin' : u.role_id === 2 ? 'Shop Admin' : 'Staff')}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${u.is_active !== false ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'}`}>
                        {u.is_active !== false ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleBypassLogin(u)}
                        className="py-1 px-2.5 bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 rounded-lg text-[11px] font-bold transition-colors"
                        title="Instant Bypass Login as this user"
                      >
                        ⚡ Login As
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingUser(u)}
                        className="py-1 px-2.5 bg-sky-600/20 border border-sky-500/40 text-sky-300 hover:bg-sky-600/30 rounded-lg text-[11px] font-bold transition-colors"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="py-1 px-2.5 bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600/30 rounded-lg text-[11px] font-bold transition-colors"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal Inline Popup */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-[9999999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h4 className="text-sm font-bold text-sky-400 mb-4 m-0">➕ Create New User / Staff Account</h4>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  placeholder="e.g. Sales Officer"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-sky-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Email</label>
                  <input
                    type="email"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    placeholder="user@shebatech.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-sky-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Phone</label>
                  <input
                    type="text"
                    value={newUserForm.phone}
                    onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                    placeholder="017xxxxxxxx"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-sky-500 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Password *</label>
                <input
                  type="text"
                  required
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  placeholder="Password"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-amber-300 font-mono outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">System Role</label>
                <select
                  value={newUserForm.role_id}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-sky-500 bg-slate-950"
                >
                  <option value={1}>Super Admin</option>
                  <option value={2}>Admin / Sales Executive</option>
                  <option value={3}>Staff / Technician</option>
                  <option value={4}>Accountant</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="py-1.5 px-3 bg-slate-800 text-slate-400 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={userActionLoading}
                  className="py-1.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl disabled:opacity-50"
                >
                  {userActionLoading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal Inline Popup */}
      {editingUser && (
        <div className="fixed inset-0 z-[9999999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h4 className="text-sm font-bold text-sky-400 mb-4 m-0">✏️ Edit User #{editingUser.id} ({editingUser.name})</h4>
            <form onSubmit={handleSaveEditUser} className="space-y-3">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Full Name</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-sky-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Email</label>
                  <input
                    type="email"
                    value={editingUser.email || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-sky-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Phone</label>
                  <input
                    type="text"
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-sky-500 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Reset Password (leave as-is or type new)</label>
                <input
                  type="text"
                  value={editingUser.password || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                  placeholder="New password or leave blank"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-amber-300 font-mono outline-none focus:border-sky-500"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={editingUser.is_active !== false}
                  onChange={(e) => setEditingUser({ ...editingUser, is_active: e.target.checked })}
                  className="w-4 h-4 accent-sky-600 rounded"
                />
                <label htmlFor="edit-active" className="text-slate-300 text-xs cursor-pointer select-none">
                  Account Active / Login Allowed
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="py-1.5 px-3 bg-slate-800 text-slate-400 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={userActionLoading}
                  className="py-1.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl disabled:opacity-50"
                >
                  {userActionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
