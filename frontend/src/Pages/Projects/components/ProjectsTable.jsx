import React from 'react';

export default function ProjectsTable({
  projects = [],
  loading = false,
  onTechPrompt,
  onInchargeConfirm,
  onAddProgress,
  onComplete,
  onPrint,
  onDelete,
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-xs">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sky-600 border-t-transparent mb-3" />
        <p className="text-slate-500 font-medium text-xs">Loading project data...</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-xs">
        <div className="text-4xl mb-2">📋</div>
        <p className="font-bold text-slate-700 text-sm mb-1">No projects or services found.</p>
        <small className="text-slate-400 text-xs">Click "+ New Project / Service" above to create a project.</small>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3.5">Project & Source</th>
              <th className="py-3 px-3.5">Customer & Site</th>
              <th className="py-3 px-3.5">Assigned Technician</th>
              <th className="py-3 px-3.5">Payout Breakdown</th>
              <th className="py-3 px-3.5">Customer Bill</th>
              <th className="py-3 px-3.5">Status Pipeline</th>
              <th className="py-3 px-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projects.map((p) => {
              const setup = parseFloat(p.setup_charge || 0);
              const conv = parseFloat(p.conveyance_cost || 0);
              const meal = parseFloat(p.meal_allowance || 0);
              const totalTechPayout =
                setup + conv + meal > 0
                  ? setup + conv + meal
                  : parseFloat(p.charges || 0);
              const customerBill = parseFloat(p.customer_billing_amount || 0);

              const isAssigned =
                p.technician_status === 'assigned' || p.status === 'assigned';
              const isAccepted =
                p.technician_status === 'accepted' ||
                p.status === 'awaiting_incharge_confirmation';
              const isInProgress =
                p.technician_status === 'in_progress' ||
                p.status === 'in_progress';
              const isCompleted = p.status === 'completed';

              return (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors bg-white">
                  {/* Project & Source */}
                  <td className="py-3.5 px-3.5 align-top">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                          p.invoice_id
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.invoice_id ? '📦 New Setup' : '🔧 Service / Repair'}
                      </span>
                      <strong className="text-slate-900 font-extrabold">{p.project_code}</strong>
                    </div>
                    <div className="font-semibold text-slate-800 text-xs">{p.title}</div>
                    {p.invoice_no && (
                      <div className="text-[11px] text-sky-600 mt-0.5">
                        Invoice: <strong>{p.invoice_no}</strong>
                      </div>
                    )}
                    {p.equipment_details &&
                      Array.isArray(p.equipment_details) &&
                      p.equipment_details.length > 0 && (
                        <div className="text-[11px] text-slate-500 mt-1 max-w-xs">
                          Equipment:{' '}
                          {p.equipment_details
                            .map((it) => `${it.product_name} (${it.quantity})`)
                            .join(', ')}
                        </div>
                      )}
                  </td>

                  {/* Customer & Site */}
                  <td className="py-3.5 px-3.5 align-top">
                    <strong className="text-slate-900 font-bold block">{p.customer_name}</strong>
                    {p.site_phone && (
                      <div className="mt-0.5">
                        <a
                          href={`tel:${p.site_phone}`}
                          className="text-emerald-700 font-semibold text-xs inline-flex items-center gap-1 hover:underline"
                        >
                          📞 {p.site_phone}
                        </a>
                      </div>
                    )}
                    {p.site_address && (
                      <div className="text-[11px] text-slate-500 mt-0.5 max-w-[200px] leading-tight">
                        📍 {p.site_address}
                      </div>
                    )}
                  </td>

                  {/* Technician */}
                  <td className="py-3.5 px-3.5 align-top">
                    <div className="flex items-center gap-1.5">
                      <span>👷</span>
                      <strong className="text-slate-800 font-bold">{p.technician_name}</strong>
                    </div>
                    {p.technician_contact && (
                      <small className="text-slate-500 text-[11px] block mt-0.5">
                        {p.technician_contact}
                      </small>
                    )}
                    {p.admin_confirmed && (
                      <div className="text-[11px] text-emerald-600 mt-1 font-bold">
                        ✓ In-Charge Confirmed
                      </div>
                    )}
                  </td>

                  {/* Remuneration Breakdown */}
                  <td className="py-3.5 px-3.5 align-top">
                    <div className="font-extrabold text-sky-600 text-sm">
                      ৳ {totalTechPayout.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex flex-col gap-0.5">
                      <span>Setup Fee: ৳{setup}</span>
                      <span>Conveyance: ৳{conv}</span>
                      <span>Meal Allowance: ৳{meal}</span>
                    </div>
                  </td>

                  {/* Customer Bill */}
                  <td className="py-3.5 px-3.5 align-top">
                    <strong className="text-emerald-700 font-extrabold text-sm block">
                      ৳ {customerBill.toLocaleString('en-IN')}
                    </strong>
                    <div className="text-[11px] text-slate-400">Service Charges</div>
                  </td>

                  {/* Pipeline Status */}
                  <td className="py-3.5 px-3.5 align-top">
                    {isCompleted ? (
                      <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md text-[11px] font-extrabold inline-flex items-center gap-1">
                        ✓ Completed & Paid
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

                    {p.progress_note && (
                      <div className="text-[11px] text-slate-500 mt-1.5 max-w-[220px] whitespace-pre-line bg-slate-50 p-1.5 rounded border border-slate-100">
                        {p.progress_note.slice(-80)}...
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-3.5 align-top text-right">
                    <div className="flex flex-col gap-1.5 items-end">
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

                      {/* 2. If accepted: In-charge Confirm Handover */}
                      {isAccepted && (
                        <button
                          type="button"
                          onClick={() => onInchargeConfirm(p)}
                          className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-[11px] font-bold cursor-pointer whitespace-nowrap shadow-xs transition-colors"
                        >
                          🛡️ In-Charge Confirm
                        </button>
                      )}

                      {/* 3. If in progress: Add Note & Complete */}
                      {isInProgress && (
                        <>
                          <button
                            type="button"
                            onClick={() => onAddProgress(p)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-md text-[11px] font-semibold cursor-pointer transition-colors"
                          >
                            📝 Add Note
                          </button>

                          <button
                            type="button"
                            onClick={() => onComplete(p)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold cursor-pointer whitespace-nowrap shadow-xs transition-colors"
                          >
                            🏁 Complete & Pay Wallet
                          </button>
                        </>
                      )}

                      {/* Print Job Card */}
                      <button
                        type="button"
                        onClick={() => onPrint(p)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-md text-[11px] font-semibold cursor-pointer flex items-center gap-1 whitespace-nowrap transition-colors"
                        title="Print Job Card & Service Slip"
                      >
                        <span>🖨️</span>
                        <span>Print Job Card</span>
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => onDelete(p.id)}
                        className="text-slate-400 hover:text-rose-600 text-[11px] font-medium cursor-pointer p-0.5 transition-colors"
                        title="Delete Project"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
