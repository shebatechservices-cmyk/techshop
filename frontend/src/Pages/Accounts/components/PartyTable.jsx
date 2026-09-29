import React from 'react';

export default function PartyTable({
  parties = [],
  loadingParties = false,
  partySearch = '',
  onOpenPartyModal = () => {}
}) {
  if (loadingParties) {
    return (
      <div className="text-center py-10 px-5 text-slate-500">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <div className="text-sm font-bold text-slate-900 mb-0.5">
          Loading party profiles...
        </div>
        <span className="text-xs text-slate-400">
          Fetching live party balances and ledger histories
        </span>
      </div>
    );
  }

  if (parties.length === 0) {
    return (
      <div className="text-center py-12 px-5 text-slate-400">
        <div className="text-4xl mb-1.5">👥</div>
        <h4 className="text-sm font-bold text-slate-900 mb-1">
          No profiles found
        </h4>
        <p className="text-xs text-slate-500">
          {partySearch
            ? `No matching party for "${partySearch}"`
            : 'No party profiles registered in this category yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="bg-slate-50 border-b-2 border-slate-200 text-slate-500 text-[11px] uppercase font-bold">
            <th className="py-2 px-3">Party Name</th>
            <th className="py-2 px-3">Classification</th>
            <th className="py-2 px-3">Contact Details</th>
            <th className="py-2 px-3">Address</th>
            <th className="py-2 px-3 text-right">Current Balance</th>
            <th className="py-2 px-3 text-center">Audit Records</th>
            <th className="py-2 px-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {parties.map((p) => {
            const bal = parseFloat(p.balance || 0);
            const isCust = p.party_type === 'customer';
            const isSupp = p.party_type === 'supplier';
            const isStaff = p.party_type === 'staff';

            const badgeConfig = isCust
              ? {
                  badge: 'bg-blue-50 text-sky-700 border-blue-200',
                  avatarBg: 'bg-blue-100 text-sky-700',
                  label: 'Customer'
                }
              : isSupp
              ? {
                  badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                  avatarBg: 'bg-emerald-100 text-emerald-700',
                  label: 'Supplier'
                }
              : {
                  badge: 'bg-purple-50 text-purple-700 border-purple-200',
                  avatarBg: 'bg-purple-100 text-purple-700',
                  label: 'Staff'
                };

            return (
              <tr
                key={`${p.party_type}-${p.id}`}
                className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors"
              >
                {/* Name & Avatar */}
                <td className="py-2 px-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-xs shrink-0 ${badgeConfig.avatarBg}`}
                    >
                      {p.name ? p.name.charAt(0).toUpperCase() : 'P'}
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => onOpenPartyModal(p.party_type, p.id, 'overview')}
                        className="font-bold text-slate-900 bg-transparent border-0 p-0 cursor-pointer text-xs text-left hover:text-sky-600 transition-colors"
                      >
                        {p.name}
                      </button>
                      <div className="text-[11px] text-slate-400 font-mono">
                        #{p.id}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Classification */}
                <td className="py-2 px-3">
                  <div className="flex flex-col gap-0.5 items-start">
                    <span
                      className={`text-[10px] py-0.5 px-1.5 rounded font-bold uppercase border ${badgeConfig.badge}`}
                    >
                      {badgeConfig.label}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {p.role_or_type || 'Standard'}
                    </span>
                  </div>
                </td>

                {/* Contact Details */}
                <td className="py-2 px-3">
                  <div className="font-semibold text-slate-800 text-xs">
                    {p.phone || '—'}
                  </div>
                  {p.email && (
                    <div className="text-[11px] text-slate-500 font-mono">
                      {p.email}
                    </div>
                  )}
                </td>

                {/* Address */}
                <td
                  className="py-2 px-3 text-slate-600 text-xs max-w-[160px] whitespace-nowrap overflow-hidden text-ellipsis"
                  title={p.address || ''}
                >
                  {p.address || '—'}
                </td>

                {/* Current Balance */}
                <td className="py-2 px-3 text-right whitespace-nowrap">
                  {isStaff ? (
                    <span className="text-[11px] text-slate-500 bg-slate-100 py-0.5 px-1.5 rounded font-semibold">
                      Active User
                    </span>
                  ) : (
                    <div>
                      <strong
                        className={`text-xs font-extrabold font-mono ${
                          bal > 0
                            ? isCust
                              ? 'text-red-600'
                              : 'text-amber-600'
                            : bal < 0
                            ? 'text-emerald-600'
                            : 'text-slate-900'
                        }`}
                      >
                        ৳{' '}
                        {bal.toLocaleString('en-BD', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </strong>
                      <div className="text-[11px] text-slate-400">
                        {bal > 0
                          ? isCust
                            ? 'Receivable Due'
                            : 'Payable Due'
                          : bal < 0
                          ? 'Advance (Credit)'
                          : 'Cleared'}
                      </div>
                    </div>
                  )}
                </td>

                {/* Audit Records */}
                <td className="py-2 px-3 text-center">
                  <span
                    className={`py-0.5 px-1.5 rounded text-[11px] font-bold ${
                      p.activity_count > 0
                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border border-slate-200 bg-slate-50 text-slate-400'
                    }`}
                  >
                    {p.activity_count > 0 ? `✓ ${p.activity_count}` : '0 records'}
                  </span>
                </td>

                {/* Actions */}
                <td className="py-2 px-3 text-center whitespace-nowrap">
                  <div className="inline-flex gap-1 items-center">
                    <button
                      type="button"
                      onClick={() => onOpenPartyModal(p.party_type, p.id, 'overview')}
                      title="View Complete Profile & Ledger"
                      className="py-1 px-2 bg-white hover:bg-slate-50 border border-slate-300 rounded text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      👤 Profile
                    </button>
                    {!isStaff && (
                      <button
                        type="button"
                        onClick={() => onOpenPartyModal(p.party_type, p.id, 'financial')}
                        title={isCust ? 'Receive Due Payment' : 'Pay Due to Supplier'}
                        className="py-1 px-2 bg-white hover:bg-sky-50 border border-slate-300 rounded text-sky-700 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        💳 Pay / Due
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onOpenPartyModal(p.party_type, p.id, 'edit')}
                      title="Edit Profile Details"
                      className="py-1 px-2 bg-white hover:bg-slate-50 border border-slate-300 rounded text-slate-600 text-xs cursor-pointer transition-colors"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenPartyModal(p.party_type, p.id, 'activity')}
                      title="Delete Check"
                      className="py-1 px-2 bg-white hover:bg-red-50 border border-red-200 rounded text-red-600 text-xs cursor-pointer transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
