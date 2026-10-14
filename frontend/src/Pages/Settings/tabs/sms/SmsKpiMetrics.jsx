import React from 'react';

export default function SmsKpiMetrics({
  smsProviders,
  smsBalance,
  handleCheckLiveBalance,
  activeTriggersCount,
  smsTriggers,
  settings,
}) {
  const activeProvider = smsProviders.find((p) => p.is_active);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Active Gateway */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
          Active SMS Gateway
        </span>
        <div className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="truncate">
            {activeProvider?.provider_name || 'No Active Gateway'}
          </span>
        </div>
        <p className="text-[11px] text-blue-600 font-semibold mt-1">
          Method: {activeProvider?.http_method || 'GET'} • Code:{' '}
          {activeProvider?.provider_code || 'default'}
        </p>
      </div>

      {/* Live Balance */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Gateway Live Balance
          </span>
          <button
            type="button"
            onClick={() => handleCheckLiveBalance()}
            disabled={smsBalance.loading}
            className="text-[10px] font-bold text-blue-600 hover:text-blue-800 disabled:opacity-50 cursor-pointer"
          >
            {smsBalance.loading ? '⏳' : '🔄 Refresh'}
          </button>
        </div>
        <div className="text-base font-extrabold text-blue-600">
          {smsBalance.loading
            ? 'Querying...'
            : smsBalance.balance !== null
            ? `${smsBalance.balance} Credits`
            : smsBalance.error
            ? 'Query Failed'
            : 'Check Balance'}
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5">
          {smsBalance.checkedAt ? `Checked at ${smsBalance.checkedAt}` : 'Live API Query'}
        </p>
      </div>

      {/* Active Triggers */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
          Active Event Triggers
        </span>
        <div className="text-base font-extrabold text-slate-900">
          {activeTriggersCount} / {smsTriggers.length} Active
        </div>
        <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
          Automated Event Dispatch Ready
        </p>
      </div>

      {/* Sender ID */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
          Approved Sender ID
        </span>
        <div className="text-base font-extrabold text-emerald-600 truncate">
          {activeProvider?.sender_id || settings?.sms_sender_id || 'NON-MASKING'}
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5">Active Gateway Sender ID</p>
      </div>
    </div>
  );
}
