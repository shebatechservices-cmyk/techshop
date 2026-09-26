import React from 'react';

export default function InchargeConfirmModal({
  project,
  onClose,
  inchargeNote,
  setInchargeNote,
  onConfirm,
}) {
  if (!project) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
        <h3 className="text-base font-extrabold text-slate-900 mb-1 flex items-center gap-2">
          <span>🛡️</span>
          <span>In-Charge Handover Approval</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          The technician has accepted this assignment. Confirm handover so the technician can commence site installation and service work.
        </p>

        <div className="bg-sky-50/60 p-3 rounded-lg border border-sky-100 mb-4 text-xs space-y-1">
          <div>
            <span className="text-slate-500">Project:</span>{' '}
            <strong className="text-slate-900">{project.title}</strong> ({project.project_code})
          </div>
          <div>
            <span className="text-slate-500">Technician:</span>{' '}
            <strong className="text-slate-900">{project.technician_name}</strong>
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            In-Charge Approval Note:
          </label>
          <input
            type="text"
            placeholder="e.g. Customer notified, handover approved for site work..."
            value={inchargeNote}
            onChange={(e) => setInchargeNote(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
          />
        </div>

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
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 shadow-sm transition-colors"
          >
            ✓ Confirm Handover
          </button>
        </div>
      </div>
    </div>
  );
}
