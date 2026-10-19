import React from 'react';

export default function ProjectCustomerSiteCell({ project: p }) {
  return (
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
  );
}
