import React from 'react';

export default function ProjectPipelineStatusCell({
  isCompleted,
  isRejectionRequested,
  isInProgress,
  isAccepted,
  progressNote
}) {
  return (
    <td className="py-3.5 px-3.5 align-top">
      {isCompleted ? (
        <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md text-[11px] font-extrabold inline-flex items-center gap-1">
          ✓ Completed &amp; Paid
        </span>
      ) : isRejectionRequested ? (
        <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-1 rounded-md text-[11px] font-extrabold inline-flex items-center gap-1 animate-pulse">
          ⚠️ Rejection Requested
        </span>
      ) : isInProgress ? (
        <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-md text-[11px] font-extrabold inline-flex items-center gap-1">
          ⏳ In Progress
        </span>
      ) : isAccepted ? (
        <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-md text-[11px] font-extrabold inline-flex items-center gap-1">
          🔵 Tech Accepted
        </span>
      ) : (
        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-[11px] font-extrabold inline-flex items-center gap-1">
          🟡 Awaiting Acceptance
        </span>
      )}

      {progressNote && (
        <div className="text-[11px] text-slate-500 mt-1.5 max-w-[220px] whitespace-pre-line bg-slate-50 p-1.5 rounded border border-slate-100">
          {progressNote.slice(-80)}...
        </div>
      )}
    </td>
  );
}
