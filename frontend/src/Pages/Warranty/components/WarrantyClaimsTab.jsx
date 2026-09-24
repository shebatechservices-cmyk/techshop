import React from 'react';

export default function WarrantyClaimsTab({
  filteredClaims = [],
  claimStatusFilter,
  setClaimStatusFilter,
  claimSearch,
  setClaimSearch,
  STATUS_CONFIG = {},
  handleUpdateClaimStatus,
  handleOpenEditClaim,
  setClaimToDelete,
  setSwapClaimModal,
  setClaimToPrint,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Filter Toolbar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap justify-between items-center gap-3">
        {/* Status Filter Tabs */}
        <div className="flex gap-1 overflow-x-auto p-1 bg-slate-200/70 rounded-xl">
          {Object.keys(STATUS_CONFIG).map((k) => {
            const isSelected = claimStatusFilter === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setClaimStatusFilter(k)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-white text-sky-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {STATUS_CONFIG[k].label}
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search claim, token, S/N, phone..."
            value={claimSearch}
            onChange={(e) => setClaimSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
          />
        </div>
      </div>

      {/* Claims Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/70 text-slate-600 border-b border-slate-200 font-bold uppercase text-[10px] tracking-wider">
              <th className="py-3 px-3.5">Token / Claim #</th>
              <th className="py-3 px-3.5">Date</th>
              <th className="py-3 px-3.5">Product & Serial</th>
              <th className="py-3 px-3.5">Customer</th>
              <th className="py-3 px-3.5">Problem / Defect</th>
              <th className="py-3 px-3.5">Status Flow</th>
              <th className="py-3 px-3.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredClaims.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  No warranty claims matching your filter.
                </td>
              </tr>
            ) : (
              filteredClaims.map((claim, idx) => {
                const currentStatus = claim.status || 'Received';

                return (
                  <tr
                    key={claim.id || idx}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3 px-3.5">
                      <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        {claim.claim_no}
                      </span>
                      {claim.invoice_no && (
                        <div className="text-[10px] text-slate-400 mt-1 font-mono">
                          Ref: {claim.invoice_no}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-slate-600 whitespace-nowrap">
                      {claim.received_date || 'Today'}
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900">{claim.product_name}</div>
                      <div className="font-mono text-[11px] text-slate-500">
                        S/N: {claim.serial_code}
                      </div>
                      {claim.replacement_serial_code && (
                        <div className="text-emerald-700 text-[11px] font-bold font-mono">
                          New S/N: {claim.replacement_serial_code}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-slate-800">{claim.customer_name}</div>
                      <div className="text-slate-500 text-[11px]">{claim.customer_phone}</div>
                    </td>
                    <td className="py-3 px-3.5 max-w-xs">
                      <div className="text-slate-700 truncate" title={claim.issue_description}>
                        {claim.issue_description}
                      </div>
                      {claim.backup_unit_provided && claim.backup_unit_provided !== 'None' && (
                        <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                          Backup: {claim.backup_unit_provided}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3.5">
                      {/* Interactive Status Selector */}
                      <select
                        value={currentStatus}
                        onChange={(e) => handleUpdateClaimStatus(claim.id, e.target.value)}
                        className={`text-[11px] font-bold px-2 py-1 rounded-lg border outline-none cursor-pointer ${
                          currentStatus === 'Delivered'
                            ? 'bg-slate-100 text-slate-700 border-slate-300'
                            : currentStatus === 'Ready for Delivery'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : currentStatus === 'Sent to Service'
                            ? 'bg-sky-50 text-sky-800 border-sky-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        <option value="Received">🟡 Received</option>
                        <option value="Sent to Service">🔵 Sent to Service</option>
                        <option value="Ready for Delivery">🟢 Ready for Delivery</option>
                        <option value="Delivered">⚪ Delivered</option>
                      </select>
                    </td>
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setClaimToPrint(claim)}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition cursor-pointer"
                          title="Print Token Slip"
                        >
                          🖨️
                        </button>
                        <button
                          type="button"
                          onClick={() => setSwapClaimModal(claim)}
                          className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs transition cursor-pointer"
                          title="Swap / Replacement S/N"
                        >
                          🔄
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditClaim(claim)}
                          className="p-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs transition cursor-pointer"
                          title="Edit Claim"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => setClaimToDelete(claim)}
                          className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs transition cursor-pointer"
                          title="Delete Claim"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
