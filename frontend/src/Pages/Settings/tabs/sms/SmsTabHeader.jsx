import React from 'react';

export default function SmsTabHeader({
  settings,
  smsProviders,
  savingTriggers,
  handleSaveSmsTriggers,
  setProviderModal,
  setTestSmsModal,
  setBulkSmsModal,
}) {
  return (
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
          onClick={() =>
            setProviderModal({
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
                is_active: false,
              },
            })
          }
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <span>＋</span>
          <span>Add Provider</span>
        </button>

        <button
          type="button"
          onClick={() =>
            setTestSmsModal({
              open: true,
              phone: settings?.phone || '+880 1700-000000',
              message: '',
              sending: false,
              result: null,
              provider_id: smsProviders.find((p) => p.is_active)?.id || '',
            })
          }
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <span>💬</span>
          <span>Test SMS</span>
        </button>

        <button
          type="button"
          onClick={() =>
            setBulkSmsModal({
              open: true,
              targetGroup: 'due_customers',
              customNumbers: '',
              message: '',
              sending: false,
              result: null,
            })
          }
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <span>📢</span>
          <span>Bulk Broadcast</span>
        </button>

        <button
          type="button"
          onClick={handleSaveSmsTriggers}
          disabled={savingTriggers}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold transition-colors shadow-sm shadow-blue-500/30 flex items-center gap-1.5 cursor-pointer"
        >
          <span>{savingTriggers ? '⏳' : '💾'}</span>
          <span>{savingTriggers ? 'Saving...' : 'Save Triggers'}</span>
        </button>
      </div>
    </div>
  );
}
