import React from 'react';

export default function ProjectsMetrics({
  counts = {},
  stageFilter,
  setStageFilter,
}) {
  const cards = [
    {
      id: 'all',
      label: 'Total Projects',
      sublabel: 'All Records',
      count: counts.all || 0,
      activeBg: 'bg-sky-50 border-sky-600 text-slate-900',
      numColor: 'text-slate-900',
      textColor: 'text-slate-500',
    },
    {
      id: 'assigned',
      label: '1. Pending Acceptance',
      sublabel: 'Prompt Sent to Tech',
      count: counts.assigned || 0,
      activeBg: 'bg-amber-50 border-amber-500 text-amber-900',
      numColor: 'text-amber-600',
      textColor: 'text-amber-700',
    },
    {
      id: 'accepted',
      label: '2. Approval Required',
      sublabel: 'Accepted by Tech',
      count: counts.accepted || 0,
      activeBg: 'bg-blue-50 border-blue-500 text-blue-900',
      numColor: 'text-blue-600',
      textColor: 'text-blue-700',
    },
    {
      id: 'in_progress',
      label: '3. In Progress',
      sublabel: 'Ongoing Work',
      count: counts.in_progress || 0,
      activeBg: 'bg-emerald-50 border-emerald-500 text-emerald-900',
      numColor: 'text-emerald-600',
      textColor: 'text-emerald-700',
    },
    {
      id: 'completed',
      label: '4. Completed & Paid',
      sublabel: 'Wallet Credited',
      count: counts.completed || 0,
      activeBg: 'bg-purple-50 border-purple-500 text-purple-900',
      numColor: 'text-purple-600',
      textColor: 'text-purple-700',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
      {cards.map((card) => {
        const isActive = stageFilter === card.id;
        return (
          <div
            key={card.id}
            onClick={() => setStageFilter(card.id)}
            className={`p-3 rounded-xl border transition-all cursor-pointer shadow-xs ${
              isActive
                ? `${card.activeBg} border-2 ring-2 ring-sky-500/10`
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className={`block text-[11px] font-bold uppercase tracking-wider ${card.textColor}`}>
              {card.label}
            </span>
            <h3 className={`text-xl font-extrabold my-0.5 ${card.numColor}`}>
              {card.count}
            </h3>
            <small className={`text-[11px] ${card.textColor}`}>
              {card.sublabel}
            </small>
          </div>
        );
      })}
    </div>
  );
}
