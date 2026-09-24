import React from "react";

export default function QuickEditModal({
  quickEdit,
  onClose,
  onChangeValue,
  onSave,
}) {
  if (!quickEdit.isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-edit-title"
    >
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
        <div className="flex items-start justify-between p-4 sm:p-5 bg-slate-50 border-b border-slate-200">
          <div>
            <h3 id="quick-edit-title" className="text-base font-bold text-slate-900">
              {quickEdit.title}
            </h3>
            <p className="text-xs text-slate-500 mt-1">{quickEdit.subtitle}</p>
          </div>
          <button
            type="button"
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
            onClick={onClose}
            aria-label="Close"
            title="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSave}>
          <div className="p-5 flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                {quickEdit.label}
              </label>
              <input
                autoFocus
                type="text"
                value={quickEdit.value}
                onChange={(e) => onChangeValue(e.target.value)}
                disabled={quickEdit.loading}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              />
            </div>
            {quickEdit.error && (
              <p className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200 font-semibold">
                ⚠️ {quickEdit.error}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2.5 p-4 bg-slate-50 border-t border-slate-200">
            <button
              type="button"
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              onClick={onClose}
              disabled={quickEdit.loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              disabled={quickEdit.loading}
            >
              {quickEdit.loading ? "Saving..." : "✓ Save Edit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
