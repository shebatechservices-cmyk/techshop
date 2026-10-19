import React from 'react';

export default function ProjectSourceCell({ project: p }) {
  return (
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

      {/* Dynamic Services Chips */}
      {p.services && Array.isArray(p.services) && p.services.length > 0 ? (
        <div className="mt-1 flex flex-wrap gap-1 max-w-xs">
          {p.services.map((srv, sIdx) => (
            <span
              key={sIdx}
              className="bg-sky-50 text-sky-800 border border-sky-200 px-1.5 py-0.5 rounded text-[10px] font-medium"
            >
              ⚡ {srv.service_name} (x{srv.quantity})
            </span>
          ))}
        </div>
      ) : (
        p.equipment_details &&
        Array.isArray(p.equipment_details) &&
        p.equipment_details.length > 0 && (
          <div className="text-[11px] text-slate-500 mt-1 max-w-xs">
            Equipment:{' '}
            {p.equipment_details
              .map((it) => `${it.product_name} (${it.quantity})`)
              .join(', ')}
          </div>
        )
      )}
    </td>
  );
}
