import React from 'react';

export default function SmsProviderBasicFields({
  data,
  providerModal,
  setProviderModal,
  handleApplyProviderPreset,
}) {
  const updateData = (field, value) => {
    setProviderModal({
      ...providerModal,
      data: { ...data, [field]: value },
    });
  };

  return (
    <>
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
            onChange={(e) => updateData('provider_name', e.target.value)}
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
            onChange={(e) => updateData('provider_code', e.target.value)}
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
          onChange={(e) => updateData('api_url', e.target.value)}
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
            onChange={(e) => updateData('http_method', e.target.value)}
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
            onChange={(e) => updateData('auth_type', e.target.value)}
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
            onChange={(e) => updateData('api_key', e.target.value)}
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
            onChange={(e) => updateData('sender_id', e.target.value)}
            placeholder="e.g. SHEBATECH"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
          />
        </div>
      </div>
    </>
  );
}
