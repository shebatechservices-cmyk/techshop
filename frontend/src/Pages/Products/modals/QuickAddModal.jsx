import React from "react";

export default function QuickAddModal({
  quickAdd,
  onClose,
  onChangeValue,
  onSave,
}) {
  if (!quickAdd.isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-50 p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-add-title"
    >
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
        <div className="flex items-start justify-between p-5 sm:p-6 bg-slate-50 border-b border-slate-200">
          <div>
            <h3 id="quick-add-title" className="text-lg font-bold text-slate-900">
              {quickAdd.title}
            </h3>
            <p className="text-xs text-slate-500 mt-1">{quickAdd.subtitle}</p>
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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(e);
          }}
        >
          <div className="p-6 flex flex-col gap-4">
            {quickAdd.extraInfo && (
              <p className="text-xs text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-200">
                {quickAdd.extraInfo}
              </p>
            )}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">
                {quickAdd.label}
              </label>
              <input
                autoFocus
                type="text"
                value={quickAdd.value}
                onChange={(e) => onChangeValue(e.target.value)}
                placeholder={quickAdd.placeholder}
                disabled={quickAdd.loading}
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all text-slate-800"
              />
            </div>
            {quickAdd.error && (
              <p className="text-xs text-rose-700 bg-rose-50 p-3 rounded-lg border border-rose-200 font-semibold">
                ⚠️ {quickAdd.error}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 p-5 bg-slate-50 border-t border-slate-200">
            <button
              type="button"
              className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
              onClick={onClose}
              disabled={quickAdd.loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              disabled={quickAdd.loading}
            >
              {quickAdd.loading ? "Saving..." : "✓ Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
