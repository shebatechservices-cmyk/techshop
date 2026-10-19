import React from 'react';

export default function SmsParamKeyMapping({ data, providerModal, setProviderModal }) {
  const updateData = (field, value) => {
    setProviderModal({
      ...providerModal,
      data: { ...data, [field]: value },
    });
  };

  return (
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
            onChange={(e) => updateData('param_phone_key', e.target.value)}
            className="w-full px-2 py-1 text-[11px] rounded-md border border-slate-300 bg-white outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Message Key</label>
          <input
            type="text"
            value={data.param_message_key || 'message'}
            onChange={(e) => updateData('param_message_key', e.target.value)}
            className="w-full px-2 py-1 text-[11px] rounded-md border border-slate-300 bg-white outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">API Key Param</label>
          <input
            type="text"
            value={data.param_api_key || 'token'}
            onChange={(e) => updateData('param_api_key', e.target.value)}
            className="w-full px-2 py-1 text-[11px] rounded-md border border-slate-300 bg-white outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Sender Key</label>
          <input
            type="text"
            value={data.param_sender_key || 'sender_id'}
            onChange={(e) => updateData('param_sender_key', e.target.value)}
            className="w-full px-2 py-1 text-[11px] rounded-md border border-slate-300 bg-white outline-none"
          />
        </div>
      </div>
    </div>
  );
}
