import React from 'react';

export default function ManageTendersModal({
  isOpen,
  onClose,
  tenders,
  accounts,
  editingTender,
  setEditingTender,
  handleUpdateTender,
  handleDeleteTender,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-scale-in">
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-lg">⚙️</span>
            <div>
              <h3 className="font-bold text-base">Manage Payment Tenders</h3>
              <p className="text-xs text-slate-300">Edit names or remove unused tenders</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {tenders.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">No tenders configured.</p>
          ) : (
            tenders.map((t) => {
              const isEditing = editingTender && editingTender.id === t.id;
              const count = accounts.filter((a) => a.tender_id === t.id).length;
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/60"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <input
                        type="text"
                        value={editingTender.name}
                        onChange={(e) => setEditingTender({ ...editingTender, name: e.target.value })}
                        className="px-2 py-1 rounded-lg border border-indigo-300 text-xs flex-1 outline-none focus:ring-2 focus:ring-indigo-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleUpdateTender(t.id, editingTender.name)}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingTender(null)}
                        className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-slate-900">{t.name}</p>
                      <p className="text-[10px] text-slate-500">{count} active account(s)</p>
                    </div>
                  )}

                  {!isEditing && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingTender({ id: t.id, name: t.name })}
                        className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
                      >
                        ✏️ Rename
                      </button>
                      <button
                        onClick={() => handleDeleteTender(t.id, t.name)}
                        disabled={count > 0}
                        title={count > 0 ? 'Cannot delete: accounts are linked to this tender' : 'Delete Tender'}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg text-xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
