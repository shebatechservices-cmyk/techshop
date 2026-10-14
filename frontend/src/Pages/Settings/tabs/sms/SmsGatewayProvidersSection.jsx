import React from 'react';

export default function SmsGatewayProvidersSection({
  smsProviders,
  setProviderModal,
  handleDeleteProvider,
  handleCheckLiveBalance,
  setTestSmsModal,
  settings,
  handleSetActiveProvider,
}) {
  return (
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
        {smsProviders.map((p) => (
          <div
            key={p.id}
            className={`rounded-lg p-3.5 border transition-all ${
              p.is_active
                ? 'border-blue-500 bg-blue-50/40 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
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
                  className="p-1 text-slate-500 hover:text-slate-800 text-xs font-bold cursor-pointer"
                  title="Edit Gateway"
                >
                  ✏️
                </button>
                {p.provider_code === 'custom' && (
                  <button
                    type="button"
                    onClick={() => handleDeleteProvider(p.id)}
                    className="p-1 text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer"
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
                <span>
                  <span className="text-slate-400">Sender:</span> <strong>{p.sender_id || 'N/A'}</strong>
                </span>
                <span>
                  <span className="text-slate-400">API Key:</span>{' '}
                  <strong>{p.api_key ? '••••••••' : 'Missing'}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                {p.balance_endpoint && (
                  <button
                    type="button"
                    onClick={() => handleCheckLiveBalance(p.id)}
                    className="px-2 py-0.5 bg-sky-100 hover:bg-sky-200 text-sky-800 rounded text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    🔄 Balance
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    setTestSmsModal({
                      open: true,
                      phone: settings?.phone || '+880 1700-000000',
                      message: '',
                      sending: false,
                      result: null,
                      provider_id: p.id,
                    })
                  }
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold transition-colors cursor-pointer"
                >
                  💬 Test
                </button>
              </div>

              {!p.is_active ? (
                <button
                  type="button"
                  onClick={() => handleSetActiveProvider(p.id)}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-bold transition-colors cursor-pointer"
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
  );
}
