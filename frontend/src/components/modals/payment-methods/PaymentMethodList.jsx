import React from 'react';

const getTypeBadge = (type) => {
  const t = String(type || '').toLowerCase();
  if (t.includes('cash')) return { label: '💵 Cash', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (t.includes('mobile') || t.includes('mfs')) return { label: '📱 MFS / Mobile', color: 'bg-purple-50 text-purple-700 border-purple-200' };
  if (t.includes('bank')) return { label: '🏦 Bank', color: 'bg-blue-50 text-blue-700 border-blue-200' };
  if (t.includes('card')) return { label: '💳 Card', color: 'bg-amber-50 text-amber-700 border-amber-200' };
  if (t.includes('wallet')) return { label: '👛 Wallet', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
  return { label: '🏷️ Other', color: 'bg-slate-50 text-slate-700 border-slate-200' };
};

export default function PaymentMethodList({
  methods,
  loading,
  onToggleActive,
  onStartEdit,
  onDeleteMethod,
  onAddNew,
}) {
  if (loading) {
    return (
      <div className="text-center py-8 text-slate-400 text-xs flex flex-col items-center gap-2">
        <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        <span>Loading payment methods...</span>
      </div>
    );
  }

  if (methods.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-xs">
        <p className="text-sm font-semibold text-slate-600 mb-1">No payment methods found.</p>
        <p>
          Click{' '}
          <button
            type="button"
            onClick={onAddNew}
            className="text-purple-600 font-bold hover:underline bg-transparent border-none cursor-pointer"
          >
            "➕ Add New Method"
          </button>{' '}
          tab to create one.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
      {methods.map((m) => {
        const badge = getTypeBadge(m.type);
        return (
          <div
            key={m.id}
            className="p-3.5 bg-white flex items-center justify-between gap-3 hover:bg-slate-50/80 transition"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-slate-800 truncate">
                  {m.name || m.method_name}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${badge.color}`}
                >
                  {badge.label}
                </span>
              </div>
              {m.account_number && (
                <div className="text-xs text-slate-500 font-mono mt-1">
                  💳 {m.account_number}
                </div>
              )}
              {m.account_details && (
                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                  {m.account_details}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Active Toggle Button */}
              <button
                type="button"
                onClick={() => onToggleActive(m.id, m.is_active)}
                className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                  m.is_active
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                }`}
                title={m.is_active ? 'Click to deactivate' : 'Click to activate'}
              >
                {m.is_active ? '● Active' : '○ Inactive'}
              </button>

              {/* Edit Button */}
              <button
                type="button"
                onClick={() => onStartEdit(m)}
                className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-xs font-semibold transition cursor-pointer"
                title="Edit details"
              >
                ✏️
              </button>

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => onDeleteMethod(m.id, m.name || m.method_name)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-xs font-semibold transition cursor-pointer"
                title="Delete / Deactivate"
              >
                🗑️
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
