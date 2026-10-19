import React from 'react';

export default function ProjectActionButtonsCell({
  project: p,
  isTechnician,
  isRejectionRequested,
  isCompleted,
  isAssigned,
  isAccepted,
  isInProgress,
  onAdminRespondRejection,
  onEdit,
  onTechPrompt,
  onInchargeConfirm,
  onAddProgress,
  onComplete,
  onReopen,
  onPrint,
  onDelete
}) {
  return (
    <td className="py-3.5 px-3.5 align-top text-right">
      <div className="flex flex-col gap-1.5 items-end">
        {/* For Admin: If Rejection Requested, show Approval & Decline buttons */}
        {!isTechnician && isRejectionRequested && onAdminRespondRejection && (
          <div className="flex flex-col gap-1 items-end w-full">
            <button
              type="button"
              onClick={() => onAdminRespondRejection(p.id, true)}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-[11px] font-bold cursor-pointer whitespace-nowrap shadow-xs transition-colors flex items-center justify-center gap-1"
              title="Approve Rejection & Release Technician"
            >
              <span>✓</span>
              <span>Approve Rejection</span>
            </button>
            <button
              type="button"
              onClick={() => onAdminRespondRejection(p.id, false)}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-md text-[11px] font-semibold cursor-pointer whitespace-nowrap transition-colors flex items-center justify-center gap-1"
              title="Decline Rejection & Keep Technician Assigned"
            >
              <span>✕</span>
              <span>Decline Request</span>
            </button>
          </div>
        )}

        {/* Edit Work Order (Allowed before completion, Admin only) */}
        {!isTechnician && !isCompleted && onEdit && (
          <button
            type="button"
            onClick={() => onEdit(p)}
            className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 rounded-md text-[11px] font-bold cursor-pointer whitespace-nowrap transition-colors flex items-center gap-1"
            title="Edit Work Order, Technician & Services"
          >
            <span>✏️</span>
            <span>Edit Work Order</span>
          </button>
        )}

        {/* 1. If assigned: Technician Accept Prompt */}
        {isAssigned && (
          <button
            type="button"
            onClick={() => onTechPrompt(p)}
            className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 rounded-md text-[11px] font-bold cursor-pointer whitespace-nowrap transition-colors"
          >
            📲 Accept Prompt
          </button>
        )}

        {/* 2. If accepted: In-charge Confirm Handover (Admin only) */}
        {!isTechnician && isAccepted && (
          <button
            type="button"
            onClick={() => onInchargeConfirm(p)}
            className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-[11px] font-bold cursor-pointer whitespace-nowrap shadow-xs transition-colors"
          >
            🛡️ In-Charge Confirm
          </button>
        )}

        {/* 3. If in progress or accepted: Add Progress Note (Both Tech and Admin) */}
        {(isInProgress || isAccepted) && onAddProgress && (
          <button
            type="button"
            onClick={() => onAddProgress(p)}
            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-md text-[11px] font-semibold cursor-pointer transition-colors"
          >
            📝 Add Note
          </button>
        )}

        {/* 4. If technician & accepted/in_progress: Request Rejection */}
        {isTechnician && (isAccepted || isInProgress) && (
          <button
            type="button"
            onClick={() => onTechPrompt(p)}
            className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300 rounded-md text-[11px] font-bold cursor-pointer whitespace-nowrap transition-colors"
            title="Submit Rejection Request to Shop Admin"
          >
            ⚠️ Request Rejection
          </button>
        )}

        {/* 5. Complete & Pay Wallet (Admin only) */}
        {!isTechnician && isInProgress && onComplete && (
          <button
            type="button"
            onClick={() => onComplete(p)}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold cursor-pointer whitespace-nowrap shadow-xs transition-colors"
          >
            🏁 Complete &amp; Pay Wallet
          </button>
        )}

        {/* 5.5 Reopen & Rollback (Admin only, when completed) */}
        {!isTechnician && isCompleted && onReopen && (
          <button
            type="button"
            onClick={() => onReopen(p)}
            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-md text-[11px] font-bold cursor-pointer whitespace-nowrap transition-colors flex items-center gap-1 shadow-xs"
            title="ভুলবশত সম্পন্ন হওয়া প্রজেক্ট রিভার্স/রিয়োপেন করুন (ওয়ালেট ও ড্রয়ার ব্যালেন্স সমন্বয় হবে)"
          >
            <span>↩️</span>
            <span>Reopen &amp; Rollback</span>
          </button>
        )}

        {/* Print Job Card (Both Tech and Admin) */}
        <button
          type="button"
          onClick={() => onPrint(p)}
          className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-md text-[11px] font-semibold cursor-pointer flex items-center gap-1 whitespace-nowrap transition-colors"
          title="Print Job Card & Service Slip"
        >
          <span>🖨️</span>
          <span>Print Job Card</span>
        </button>

        {/* Delete (Admin only) */}
        {!isTechnician && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(p.id)}
            className="text-slate-400 hover:text-rose-600 text-[11px] font-medium cursor-pointer p-0.5 transition-colors"
            title="Delete Project"
          >
            🗑️ Delete
          </button>
        )}
      </div>
    </td>
  );
}
