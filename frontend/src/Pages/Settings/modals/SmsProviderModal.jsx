import React from 'react';

export default function SmsProviderModal({
  providerModal,
  setProviderModal,
  handleSaveProvider,
  handleApplyProviderPreset,
}) {
  if (!providerModal?.open) return null;

  const handleClose = () => {
    setProviderModal({ open: false, mode: 'create', data: {} });
  };

  const data = providerModal.data || {};

  return (
    <div
      className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-4 text-white flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>⚙️</span> {providerModal.mode === 'edit' ? 'Edit SMS Gateway Provider' : 'Add New SMS Gateway Provider'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Configure gateway endpoints, authentication credentials, and request mapping
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition flex items-center justify-center text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSaveProvider} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 overflow-y-auto flex-1 space-y-3.5 text-xs">
            {/* Quick Provider Preset */}
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-3">
              <label className="block text-[11px] font-bold text-sky-800 uppercase tracking-wider mb-1">
                ⚡ Quick Provider Preset
              </label>
              <select
                onChange={(e) => handleApplyProviderPreset && handleApplyProviderPreset(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
                defaultValue=""
              >
                <option value="" disabled>-- Select Preset Template --</option>
                <option value="greenweb">🟢 Greenweb Bangladesh (GET / Token)</option>
                <option value="bulksmsbd">🔵 BulkSMS BD Official (GET / ApiKey)</option>
                <option value="msensit">🟣 mSensit SMS Gateway (POST JSON)</option>
                <option value="elitbuzz">🟠 ElitBuzz SMS (POST JSON)</option>
                <option value="twilio">🌐 Twilio SMS International (POST Basic)</option>
                <option value="custom">⚙️ Custom HTTP Webhook / API</option>
              </select>
            </div>

            {/* Provider Name & Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Provider Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={data.provider_name || ''}
                  onChange={(e) =>
                    setProviderModal({
                      ...providerModal,
                      data: { ...data, provider_name: e.target.value },
                    })
                  }
                  placeholder="e.g. Greenweb Bangladesh"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Provider Code
                </label>
                <input
                  type="text"
                  value={data.provider_code || ''}
                  onChange={(e) =>
                    setProviderModal({
                      ...providerModal,
                      data: { ...data, provider_code: e.target.value },
                    })
                  }
                  placeholder="e.g. greenweb"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>

            {/* API Endpoint URL */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                API Endpoint URL <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={data.api_url || ''}
                onChange={(e) =>
                  setProviderModal({
                    ...providerModal,
                    data: { ...data, api_url: e.target.value },
                  })
                }
                placeholder="http://api.greenweb.com.bd/api.php"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
              />
            </div>

            {/* HTTP Method & Auth Mechanism */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  HTTP Method
                </label>
                <select
                  value={data.http_method || 'GET'}
                  onChange={(e) =>
                    setProviderModal({
                      ...providerModal,
                      data: { ...data, http_method: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                >
                  <option value="GET">GET (Query Params)</option>
                  <option value="POST">POST (JSON Body)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Auth Mechanism
                </label>
                <select
                  value={data.auth_type || 'param'}
                  onChange={(e) =>
                    setProviderModal({
                      ...providerModal,
                      data: { ...data, auth_type: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                >
                  <option value="param">Query/Body Parameter</option>
                  <option value="bearer">Bearer Token (Header)</option>
                  <option value="basic">Basic Auth (Twilio)</option>
                </select>
              </div>
            </div>

            {/* API Key & Masking Sender ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  API Key / Secret Token
                </label>
                <input
                  type="password"
                  value={data.api_key || ''}
                  onChange={(e) =>
                    setProviderModal({
                      ...providerModal,
                      data: { ...data, api_key: e.target.value },
                    })
                  }
                  placeholder="Enter Gateway API Key"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Masking Sender ID
                </label>
                <input
                  type="text"
                  value={data.sender_id || ''}
                  onChange={(e) =>
                    setProviderModal({
                      ...providerModal,
                      data: { ...data, sender_id: e.target.value },
                    })
                  }
                  placeholder="e.g. SHEBATECH"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>

            {/* Parameter Keys Mapping */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                Parameter Key Mapping
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Phone Key</label>
                  <input
                    type="text"
                    value={data.param_phone_key || 'to'}
                    onChange={(e) =>
                      setProviderModal({
                        ...providerModal,
                        data: { ...data, param_phone_key: e.target.value },
                      })
                    }
                    className="w-full px-2 py-1 text-[11px] rounded-md border border-slate-300 bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Message Key</label>
                  <input
                    type="text"
                    value={data.param_message_key || 'message'}
                    onChange={(e) =>
                      setProviderModal({
                        ...providerModal,
                        data: { ...data, param_message_key: e.target.value },
                      })
                    }
                    className="w-full px-2 py-1 text-[11px] rounded-md border border-slate-300 bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">API Key Param</label>
                  <input
                    type="text"
                    value={data.param_api_key || 'token'}
                    onChange={(e) =>
                      setProviderModal({
                        ...providerModal,
                        data: { ...data, param_api_key: e.target.value },
                      })
                    }
                    className="w-full px-2 py-1 text-[11px] rounded-md border border-slate-300 bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Sender Key</label>
                  <input
                    type="text"
                    value={data.param_sender_key || 'sender_id'}
                    onChange={(e) =>
                      setProviderModal({
                        ...providerModal,
                        data: { ...data, param_sender_key: e.target.value },
                      })
                    }
                    className="w-full px-2 py-1 text-[11px] rounded-md border border-slate-300 bg-white outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Live Balance Query URL */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Live Balance Query URL <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={data.balance_endpoint || ''}
                onChange={(e) =>
                  setProviderModal({
                    ...providerModal,
                    data: { ...data, balance_endpoint: e.target.value },
                  })
                }
                placeholder="http://api.greenweb.com.bd/gurecomm/credit.php"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
              />
            </div>

            {/* Set as Active */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="is_active_provider_check"
                checked={!!data.is_active}
                onChange={(e) =>
                  setProviderModal({
                    ...providerModal,
                    data: { ...data, is_active: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
              />
              <label
                htmlFor="is_active_provider_check"
                className="text-xs font-bold text-slate-800 cursor-pointer select-none"
              >
                Set as Active System SMS Gateway
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-sm transition cursor-pointer"
            >
              Save Provider
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
