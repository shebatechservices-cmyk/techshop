import React from 'react';

export default function PartyProfileHeader({
  profile = {},
  partyType = 'customer',
  balance = 0,
  typeBadgeColors = {},
  onClose,
}) {
  return (
    <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-gradient-to-br from-slate-900 to-slate-800 text-white flex justify-between items-center flex-wrap gap-3 border-b border-slate-700/80">
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${typeBadgeColors.bg} ${typeBadgeColors.text} flex items-center justify-center text-base sm:text-lg font-extrabold shadow-md flex-shrink-0`}
        >
          {profile.name ? profile.name.charAt(0).toUpperCase() : 'P'}
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-white tracking-tight">
              {profile.name || 'Loading Profile...'}
            </h3>
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${typeBadgeColors.bg} ${typeBadgeColors.text}`}
            >
              {typeBadgeColors.label}
            </span>
            <span className="text-[11px] text-slate-400">#{profile.id}</span>
          </div>
          <div className="flex gap-2.5 mt-0.5 text-xs text-slate-300 flex-wrap">
            {profile.phone && <span className="text-[11px]">📞 {profile.phone}</span>}
            {profile.email && <span className="text-[11px]">✉️ {profile.email}</span>}
            {profile.role_or_type && (
              <span className="bg-white/10 px-1.5 py-0.2 rounded text-[10px]">
                🏷️ {profile.role_or_type}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Balance & Close Button */}
      <div className="flex items-center gap-3.5">
        <div className="text-right">
          <div className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">
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
            className={`text-base sm:text-lg font-black tracking-tight ${
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
          type="button"
          onClick={onClose}
          className="bg-white/10 hover:bg-white/20 text-white w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors"
          title="Close modal"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
