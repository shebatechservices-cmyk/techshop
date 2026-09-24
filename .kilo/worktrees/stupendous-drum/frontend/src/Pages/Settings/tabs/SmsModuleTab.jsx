import React from 'react';

export default function SmsModuleTab({
  settings,
  setSettings,
  savingTriggers,
  handleSaveSmsTriggers,
  smsProviders,
  smsBalance,
  handleCheckLiveBalance,
  handleSetActiveProvider,
  handleDeleteProvider,
  setProviderModal,
  setTestSmsModal,
  setBulkSmsModal,
  smsCategoryFilter,
  setSmsCategoryFilter,
  filteredTriggers,
  activeTriggersCount,
  smsTriggers,
  handleToggleSmsTrigger,
  handleTemplateChange,
  handleInsertToken,
  handleOpenSamplePreview,
  smsLogs
}) {
  return (
    <div className="space-y-6">
      {/* Sub-page Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <span>Settings</span>
            <span>/</span>
            <span className="text-blue-600 font-bold">SMS Automation</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>📱</span> SMS Gateways & Automation Triggers Engine
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure multi-provider SMS gateways, live balance queries, custom webhook parameters, and 11 automated event dispatchers.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => setProviderModal({
              open: true,
              mode: 'create',
              data: {
                provider_name: 'Custom SMS Gateway',
                provider_code: 'custom',
                api_url: '',
                http_method: 'POST',
                auth_type: 'param',
                api_key: '',
                api_secret: '',
                sender_id: '',
                param_phone_key: 'to',
                param_message_key: 'message',
                param_sender_key: 'sender_id',
                param_api_key: 'token',
                balance_endpoint: '',
                is_active: false
              }
            })}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
          >
            <span>＋</span>
            <span>Add Provider</span>
          </button>

          <button
            type="button"
            onClick={() => setTestSmsModal({
              open: true,
              phone: settings.phone || '+880 1700-000000',
              message: '',
              sending: false,
              result: null,
              provider_id: (smsProviders.find(p => p.is_active)?.id || '')
            })}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <span>💬</span>
            <span>Test SMS</span>
          </button>

          <button
            type="button"
            onClick={() => setBulkSmsModal({
              open: true,
              targetGroup: 'due_customers',
              customNumbers: '',
              message: '',
              sending: false,
              result: null
            })}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
          >
            <span>📢</span>
            <span>Bulk Broadcast</span>
          </button>

          <button
            type="button"
            onClick={handleSaveSmsTriggers}
            disabled={savingTriggers}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold transition-colors shadow-sm shadow-blue-500/30 flex items-center gap-1.5"
          >
            <span>{savingTriggers ? '⏳' : '💾'}</span>
            <span>{savingTriggers ? 'Saving...' : 'Save Triggers'}</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Active Gateway */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
            Active SMS Gateway
          </span>
          <div className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="truncate">{smsProviders.find(p => p.is_active)?.provider_name || 'No Active Gateway'}</span>
          </div>
          <p className="text-[11px] text-blue-600 font-semibold mt-1">
            Method: {smsProviders.find(p => p.is_active)?.http_method || 'GET'} • Code: {smsProviders.find(p => p.is_active)?.provider_code || 'default'}
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
              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              {smsBalance.loading ? '⏳' : '🔄 Refresh'}
            </button>
          </div>
          <div className="text-base font-extrabold text-blue-600">
            {smsBalance.loading ? 'Querying...' : smsBalance.balance !== null ? `${smsBalance.balance} Credits` : (smsBalance.error ? 'Query Failed' : 'Check Balance')}
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
            {smsProviders.find(p => p.is_active)?.sender_id || settings.sms_sender_id || 'NON-MASKING'}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Active Gateway Sender ID</p>
        </div>
      </div>

      {/* Gateway Providers Section */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Configured SMS Gateway Providers
            </h4>
            <p className="text-[11px] text-slate-500">
              Select the active gateway used for all automated event alerts and bulk SMS dispatches.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {smsProviders.map(p => (
            <div
              key={p.id}
              className={`rounded-lg p-3.5 border transition-all ${
                p.is_active ? 'border-blue-500 bg-blue-50/40 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <strong className="text-sm font-bold text-slate-900">{p.provider_name}</strong>
                    {p.is_active && (
                      <span className="bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Route: {p.provider_code} • {p.http_method} ({p.auth_type})
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setProviderModal({ open: true, mode: 'edit', data: { ...p } })}
                    className="p-1 text-slate-500 hover:text-slate-800 text-xs font-bold"
                    title="Edit Gateway"
                  >
                    ✏️
                  </button>
                  {p.provider_code === 'custom' && (
                    <button
                      type="button"
                      onClick={() => handleDeleteProvider(p.id)}
                      className="p-1 text-rose-500 hover:text-rose-700 text-xs font-bold"
                      title="Delete Gateway"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 rounded p-2 text-xs font-mono text-slate-600 space-y-1 mb-3">
                <div className="truncate">
                  <span className="text-slate-400">Endpoint:</span> {p.api_url || '(Not configured)'}
                </div>
                <div className="flex justify-between text-[11px]">
                  <span><span className="text-slate-400">Sender:</span> <strong>{p.sender_id || 'N/A'}</strong></span>
                  <span><span className="text-slate-400">API Key:</span> <strong>{p.api_key ? '••••••••' : 'Missing'}</strong></span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  {p.balance_endpoint && (
                    <button
                      type="button"
                      onClick={() => handleCheckLiveBalance(p.id)}
                      className="px-2 py-0.5 bg-sky-100 hover:bg-sky-200 text-sky-800 rounded text-[10px] font-bold transition-colors"
                    >
                      🔄 Balance
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setTestSmsModal({
                      open: true,
                      phone: settings.phone || '+880 1700-000000',
                      message: '',
                      sending: false,
                      result: null,
                      provider_id: p.id
                    })}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold transition-colors"
                  >
                    💬 Test
                  </button>
                </div>

                {!p.is_active ? (
                  <button
                    type="button"
                    onClick={() => handleSetActiveProvider(p.id)}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-bold transition-colors"
                  >
                    Set Active
                  </button>
                ) : (
                  <span className="text-[11px] text-emerald-600 font-bold">
                    ✓ Active Dispatcher
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {['All', 'Sales & POS', 'Purchases & Stock', 'Customer Credit', 'Projects & Servicing', 'Accounts & Wallets', 'Security & Auth'].map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSmsCategoryFilter(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                smsCategoryFilter === cat
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Showing <strong>{filteredTriggers.length}</strong> event triggers
        </span>
      </div>

      {/* Event Triggers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTriggers.map((trig) => {
          const charCount = (trig.template_bn || '').length;
          const smsCount = Math.ceil(charCount / 160) || 1;
          const tokensArray = (trig.available_tokens || '').split(',').map(s => s.trim()).filter(Boolean);

          return (
            <div
              key={trig.trigger_key}
              className={`rounded-lg border p-4 shadow-sm transition-all flex flex-col justify-between ${
                trig.is_enabled ? 'bg-white border-slate-300' : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        {trig.category}
                      </span>
                      <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded">
                        👤 {trig.recipient_type}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {trig.trigger_name}
                    </h4>
                  </div>

                  <input
                    type="checkbox"
                    checked={trig.is_enabled}
                    onChange={() => handleToggleSmsTrigger(trig.trigger_key)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer mt-1"
                  />
                </div>

                {/* Template Textarea */}
                <textarea
                  rows="3"
                  value={trig.template_bn || ''}
                  onChange={(e) => handleTemplateChange(trig.trigger_key, e.target.value)}
                  disabled={!trig.is_enabled}
                  placeholder="Enter template notification message..."
                  className="w-full p-2 border border-slate-300 rounded text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed mb-2 disabled:bg-slate-100"
                />

                {/* Dynamic Tokens */}
                <div className="mb-3">
                  <span className="text-[10px] text-slate-500 block mb-1 font-medium">Click to insert dynamic token:</span>
                  <div className="flex flex-wrap gap-1">
                    {tokensArray.map(token => (
                      <button
                        key={token}
                        type="button"
                        onClick={() => handleInsertToken(trig.trigger_key, token)}
                        disabled={!trig.is_enabled}
                        className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded text-[10px] font-semibold transition-colors disabled:opacity-40"
                      >
                        {token}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <span>{charCount} chars (~{smsCount} SMS)</span>
                <button
                  type="button"
                  onClick={() => handleOpenSamplePreview(trig)}
                  className="text-blue-600 hover:text-blue-800 font-bold"
                >
                  👁️ Sample Preview
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* SMS Logs Table */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
          📜 Recent Automated SMS Dispatch Logs
        </h4>
        <div className="overflow-x-auto border border-slate-200 rounded-md">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="px-3 py-2">Timestamp</th>
                <th className="px-3 py-2">Trigger Event</th>
                <th className="px-3 py-2">Recipient Phone</th>
                <th className="px-3 py-2">Message Content</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {smsLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-3 py-4 text-center text-slate-400">
                    No SMS logs found. Dispatches will appear here in real-time.
                  </td>
                </tr>
              ) : (
                smsLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : 'Just now'}
                    </td>
                    <td className="px-3 py-2 font-semibold text-slate-800">{log.trigger_name || log.trigger_key}</td>
                    <td className="px-3 py-2 font-mono text-slate-700">{log.phone}</td>
                    <td className="px-3 py-2 text-slate-600 max-w-xs truncate">{log.message}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {log.status === 'DELIVERED' ? '✓ DELIVERED' : log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
