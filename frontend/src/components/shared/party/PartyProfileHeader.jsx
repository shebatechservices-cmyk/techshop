import React from 'react';

export default function PartyProfileHeader({
  profile = {},
  partyType = 'customer',
  balance = 0,
  typeBadgeColors = {},
  onClose,
}) {
  return (
    <div className="p-5 sm:p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white flex justify-between items-center flex-wrap gap-4 border-b border-slate-700">
      <div className="flex items-center gap-3.5">
        <div
          className={`w-12 h-12 rounded-2xl ${typeBadgeColors.bg} ${typeBadgeColors.text} flex items-center justify-center text-xl font-extrabold shadow-lg flex-shrink-0`}
        >
          {profile.name ? profile.name.charAt(0).toUpperCase() : 'P'}
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-bold text-white tracking-tight">
              {profile.name || 'Loading Profile...'}
            </h3>
            <span
              className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${typeBadgeColors.bg} ${typeBadgeColors.text}`}
            >
              {typeBadgeColors.label}
            </span>
            <span className="text-xs text-slate-400">#{profile.id}</span>
          </div>
          <div className="flex gap-3 mt-1 text-xs text-slate-300 flex-wrap">
            {profile.phone && <span>📞 {profile.phone}</span>}
            {profile.email && <span>✉️ {profile.email}</span>}
            {profile.role_or_type && (
              <span className="bg-white/10 px-2 py-0.5 rounded text-[11px]">
                🏷️ {profile.role_or_type}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Balance & Close Button */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
            {partyType === 'customer'
              ? balance > 0
                ? 'Receivable Due'
                : balance < 0
                ? 'Advance Credit'
                : 'Balance'
              : partyType === 'supplier'
              ? balance > 0
                ? 'Payable Due'
                : balance < 0
                ? 'Advance Paid'
                : 'Balance'
              : 'Account Balance'}
          </div>
          <div
            className={`text-xl font-extrabold ${
              balance > 0
                ? partyType === 'customer'
                  ? 'text-rose-400'
                  : 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            ৳ {balance.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <button
          onClick={onClose}
          className="bg-white/10 hover:bg-white/20 text-white w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
