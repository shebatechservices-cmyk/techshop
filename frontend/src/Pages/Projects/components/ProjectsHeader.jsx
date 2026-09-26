import React from 'react';

export default function ProjectsHeader({
  error,
  onOpenTechWallet,
  onOpenNewProject,
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center pb-2.5 border-b border-slate-200 flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">📹</span>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Projects & Services (Installation & Maintenance)
            </h2>
          </div>
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          <button
            type="button"
            onClick={onOpenTechWallet}
            className="bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <span>💼</span>
            <span>Technician Wallet</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewProject}
            className="bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <span className="text-sm font-black">+</span>
            <span>New Project / Service</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold">
          {error}
        </div>
      )}
    </div>
  );
}
