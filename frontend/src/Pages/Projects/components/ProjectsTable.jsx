import React from 'react';
import ProjectsTableRow from './table/ProjectsTableRow';

export default function ProjectsTable({
  projects = [],
  loading = false,
  isTechnician = false,
  currentUser = null,
  onTechPrompt,
  onInchargeConfirm,
  onAddProgress,
  onComplete,
  onReopen,
  onEdit,
  onPrint,
  onDelete,
  onAdminRespondRejection,
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
              <th className="py-3 px-3.5">Project &amp; Source</th>
              <th className="py-3 px-3.5">Customer &amp; Site</th>
              {!isTechnician && <th className="py-3 px-3.5">Assigned Technician</th>}
              <th className="py-3 px-3.5">Payout Breakdown</th>
              <th className="py-3 px-3.5">{isTechnician ? 'Bill to Collect' : 'Customer Bill'}</th>
              <th className="py-3 px-3.5">Status Pipeline</th>
              <th className="py-3 px-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projects.map((p) => (
              <ProjectsTableRow
                key={p.id}
                project={p}
                isTechnician={isTechnician}
                onTechPrompt={onTechPrompt}
                onInchargeConfirm={onInchargeConfirm}
                onAddProgress={onAddProgress}
                onComplete={onComplete}
                onReopen={onReopen}
                onEdit={onEdit}
                onPrint={onPrint}
                onDelete={onDelete}
                onAdminRespondRejection={onAdminRespondRejection}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
