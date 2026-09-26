import React from 'react';

export default function ProgressNoteModal({
  project,
  onClose,
  newProgressNote,
  setNewProgressNote,
  onSubmit,
}) {
  if (!project) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
        <h3 className="text-base font-extrabold text-slate-900 mb-1 flex items-center gap-2">
          <span>📝</span>
          <span>Add Project Progress Note</span>
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Project: <strong className="text-slate-800">{project.project_code}</strong> ({project.title})
        </p>

        <textarea
          rows="4"
          placeholder="e.g. Arrived on site, 4 cameras cabled, DVR configuration in progress..."
          value={newProgressNote}
          onChange={(e) => setNewProgressNote(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all mb-4"
        />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="px-4 py-2 rounded-lg bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 shadow-sm transition-colors"
          >
            Save Progress Note
          </button>
        </div>
      </div>
    </div>
  );
}
