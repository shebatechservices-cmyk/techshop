import React from 'react';

export default function UomTable({
  uoms,
  loading,
  editingId,
  editName,
  setEditName,
  editCode,
  setEditCode,
  editFractional,
  setEditFractional,
  editActive,
  setEditActive,
  savingEdit,
  handleSaveEdit,
  cancelEdit,
  startEdit,
  handleDeleteUom
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-300 overflow-hidden shadow-sm">
      <table className="w-full border-collapse text-[0.8rem]">
        <thead>
          <tr className="bg-slate-100 border-b border-slate-300 text-slate-600 text-left">
            <th className="py-2 px-3 w-[32%] font-semibold">Unit Name</th>
            <th className="py-2 px-3 w-[18%] font-semibold">Short Code</th>
            <th className="py-2 px-3 w-[25%] font-semibold">Fractional Qty</th>
            <th className="py-2 px-3 w-[12%] font-semibold">Status</th>
            <th className="py-2 px-3 w-[13%] font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading && uoms.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-5 text-center text-slate-500">
                Loading units of measurement...
              </td>
            </tr>
          ) : uoms.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-5 text-center text-slate-500">
                No measurement units found. Add your first unit above.
              </td>
            </tr>
          ) : (
            uoms.map((u) => {
              const isEditing = editingId === u.id;
              return (
                <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2 px-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full py-1 px-1.5 rounded border border-slate-300 text-[0.8rem] focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
                      />
                    ) : (
                      <span className="font-semibold text-slate-800">{u.name}</span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editCode}
                        onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                        className="w-20 py-1 px-1.5 rounded border border-slate-300 text-[0.8rem] uppercase focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
                      />
                    ) : (
                      <span className="font-mono font-bold text-sky-600 bg-sky-50 py-0.5 px-1.5 rounded">
                        {u.code || '—'}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {isEditing ? (
                      <label className="flex items-center gap-1 text-[0.74rem] text-sky-700 font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editFractional}
                          onChange={(e) => setEditFractional(e.target.checked)}
                          className="rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                        />
                        Allow Fractional
                      </label>
                    ) : u.is_fractional_allowed ? (
                      <span className="bg-sky-100 text-sky-700 py-0.5 px-1.5 rounded text-[0.72rem] font-bold inline-block">
                        ✓ Fractional Allowed
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 py-0.5 px-1.5 rounded text-[0.72rem] font-semibold inline-block">
                        Whole Units Only
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {isEditing ? (
                      <label className="flex items-center gap-1 text-[0.74rem] text-slate-700 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editActive}
                          onChange={(e) => setEditActive(e.target.checked)}
                          className="rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                        />
                        Active
                      </label>
                    ) : u.is_active ? (
                      <span className="bg-emerald-100 text-emerald-700 py-0.5 px-1.5 rounded text-[0.72rem] font-bold inline-block">
                        Active
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 py-0.5 px-1.5 rounded text-[0.72rem] font-semibold inline-block">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right">
                    {isEditing ? (
                      <div className="flex gap-1 justify-end">
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(u.id)}
                          disabled={savingEdit}
                          className="py-1 px-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[0.74rem] transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="py-1 px-2 rounded bg-slate-200 hover:bg-slate-300 text-slate-600 text-[0.74rem] transition-colors cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => startEdit(u)}
                          title="Edit Unit"
                          className="text-sky-600 hover:text-sky-800 text-[0.85rem] cursor-pointer p-0.5 transition-colors"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUom(u.id, u.name)}
                          title="Delete Unit"
                          className="text-slate-400 hover:text-red-500 text-[0.85rem] cursor-pointer p-0.5 transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
