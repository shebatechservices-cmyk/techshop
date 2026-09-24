import React from 'react';

export default function PartyEditTab({
  partyType,
  editForm,
  setEditForm,
  editLoading,
  error,
  successMsg,
  handleEditSubmit,
}) {
  return (
    <div>
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl mb-3.5 text-xs font-medium">
          ⚠️ {error}
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl mb-3.5 text-xs font-medium">
          ✓ {successMsg}
        </div>
      )}

      <form onSubmit={handleEditSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
            <input
              type="text"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {partyType === 'customer' ? 'Customer Type' : partyType === 'supplier' ? 'Contact Person / Designation' : 'Staff Role'}
            </label>
            {partyType === 'customer' ? (
              <select
                value={editForm.role_or_type}
                onChange={(e) => setEditForm({ ...editForm, role_or_type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 bg-white transition-all font-medium"
              >
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
                <option value="corporate">Corporate</option>
              </select>
            ) : partyType === 'staff' ? (
              <select
                value={editForm.role_id}
                onChange={(e) => setEditForm({ ...editForm, role_id: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 bg-white transition-all font-medium"
              >
                <option value={1}>Super Admin</option>
                <option value={2}>Admin</option>
                <option value={3}>Staff</option>
                <option value={4}>Online Technician</option>
              </select>
            ) : (
              <input
                type="text"
                value={editForm.role_or_type}
                onChange={(e) => setEditForm({ ...editForm, role_or_type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all font-medium"
              />
            )}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Physical Address</label>
          <textarea
            rows={2}
            value={editForm.address}
            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={editLoading}
          className="py-2 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md transition-all disabled:opacity-50"
        >
          {editLoading ? 'Saving Changes...' : 'Save Profile Changes'}
        </button>
      </form>
    </div>
  );
}
