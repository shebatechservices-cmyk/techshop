import React from 'react';

export default function ProjectFinancialStatusCell({
  totalTechPayout,
  setup,
  conv,
  meal,
  customerBill,
  isTechnician
}) {
  return (
    <>
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

      {/* Customer Bill / Cash to Collect */}
      <td className="py-3.5 px-3.5 align-top">
        <strong className="text-emerald-700 font-extrabold text-sm block">
          ৳ {customerBill.toLocaleString('en-IN')}
        </strong>
        <div className="text-[11px] text-slate-400">
          {isTechnician ? 'Collect on Site' : 'Service Charges'}
        </div>
      </td>
    </>
  );
}
