import React from 'react';
import SmsProviderBasicFields from './sms-provider/SmsProviderBasicFields';
import SmsParamKeyMapping from './sms-provider/SmsParamKeyMapping';

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
              <span>⚙️</span>{' '}
              {providerModal.mode === 'edit'
                ? 'Edit SMS Gateway Provider'
                : 'Add New SMS Gateway Provider'}
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
            <SmsProviderBasicFields
              data={data}
              providerModal={providerModal}
              setProviderModal={setProviderModal}
              handleApplyProviderPreset={handleApplyProviderPreset}
            />

            <SmsParamKeyMapping
              data={data}
              providerModal={providerModal}
              setProviderModal={setProviderModal}
            />

            {/* Live Balance Query URL */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Live Balance Query URL{' '}
                <span className="text-slate-400 font-normal">(Optional)</span>
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
