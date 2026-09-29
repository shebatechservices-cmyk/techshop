import React from 'react';

export default function WalletProjectsTab({ projects = [] }) {
  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
        <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">
          📋
        </div>
        <h3 className="text-sm font-bold text-slate-800">No Assigned Projects Found</h3>
        <p className="text-xs text-slate-500 mt-1">
          When the Shop Admin assigns you CCTV or service tasks, they will appear here with your commission breakdown.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((proj) => {
          const totalComm =
            (parseFloat(proj.charges) || 0) +
            (parseFloat(proj.conveyance_cost) || 0) +
            (parseFloat(proj.meal_allowance) || 0);
          const isDone =
            proj.status === 'completed' ||
            proj.technician_status === 'completed' ||
            proj.admin_confirmed;

          return (
            <div
              key={proj.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                    {proj.project_code || 'PROJ-' + proj.id}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isDone
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {isDone ? '✓ Completed' : '⏳ In Progress'}
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 text-sm mb-1">{proj.title}</h4>
                {proj.customer_name && (
                  <p className="text-xs text-slate-600 mb-2">
                    👤 Customer: <span className="font-semibold">{proj.customer_name}</span>{' '}
                    {proj.customer_phone ? `(${proj.customer_phone})` : ''}
                  </p>
                )}
                {proj.site_address && (
                  <p className="text-[11px] text-slate-500 mb-3 flex items-start gap-1">
                    <span>📍</span>
                    <span>{proj.site_address}</span>
                  </p>
                )}

                {/* Earnings Breakdown */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Service Charge:</span>
                    <span className="font-semibold text-slate-800">
                      ৳{parseFloat(proj.charges || 0).toLocaleString()}
                    </span>
                  </div>
                  {parseFloat(proj.conveyance_cost || 0) > 0 && (
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Conveyance Allowance:</span>
                      <span className="font-semibold text-slate-800">
                        ৳{parseFloat(proj.conveyance_cost || 0).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {parseFloat(proj.meal_allowance || 0) > 0 && (
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Meal Allowance:</span>
                      <span className="font-semibold text-slate-800">
                        ৳{parseFloat(proj.meal_allowance || 0).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-slate-200">
                    <span>Your Total Commission:</span>
                    <span>৳{totalComm.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100">
                <span>
                  Date: {proj.start_date ? new Date(proj.start_date).toLocaleDateString('en-GB') : 'N/A'}
                </span>
                {proj.admin_confirmed && (
                  <span className="text-emerald-600 font-semibold">🔒 Admin Approved</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
