import React from 'react';

export default function ProjectTechnicianCell({ project: p }) {
  return (
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
  );
}
