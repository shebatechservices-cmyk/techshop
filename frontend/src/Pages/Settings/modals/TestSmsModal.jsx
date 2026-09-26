import React from 'react';
import BangladeshiPhoneInput from '../../../components/ui/BangladeshiPhoneInput';

export default function TestSmsModal({
  testSmsModal,
  setTestSmsModal,
  handleSendTestSms,
  smsProviders = [],
  settings = {},
}) {
  if (!testSmsModal?.open) return null;

  const handleClose = () => {
    setTestSmsModal({
      open: false,
      phone: '',
      message: '',
      sending: false,
      result: null,
      provider_id: '',
    });
  };

  const activeProvider = smsProviders.find((p) => p.is_active);

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
              <span>💬</span> Send Live Test SMS
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Verify real-time gateway delivery and API responsiveness
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

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3.5 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Gateway Provider
            </label>
            <select
              value={testSmsModal.provider_id || (activeProvider?.id || '')}
              onChange={(e) => setTestSmsModal({ ...testSmsModal, provider_id: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
            >
              <option value="">-- Active System Provider (Default) --</option>
              {smsProviders.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.provider_name} {p.is_active ? '✓ (Active)' : ''} ({p.http_method})
                </option>
              ))}
            </select>
          </div>

          <div>
            <BangladeshiPhoneInput
              label="Recipient Mobile Number"
              required
              value={testSmsModal.phone}
              onChange={(e) => setTestSmsModal({ ...testSmsModal, phone: e.target.value })}
              placeholder="1X-XXXXXXXX"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Message Content
              </label>
              <span className="text-[10px] text-slate-500">
                {(testSmsModal.message || '').length} chars
              </span>
            </div>
            <textarea
              rows={3}
              value={testSmsModal.message}
              onChange={(e) => setTestSmsModal({ ...testSmsModal, message: e.target.value })}
              placeholder={`[${settings.shop_name || 'Sheba Tech'}] Test SMS notification. Gateway verification completed.`}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition resize-y"
            />
          </div>

          {testSmsModal.result && (
            <div
              className={`p-3 rounded-xl border text-xs leading-relaxed ${
                testSmsModal.result.status === 'DELIVERED'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              <div>
                <strong>Delivery Status:</strong> {testSmsModal.result.status}
              </div>
              {testSmsModal.result.provider && (
                <div>
                  <strong>Provider:</strong> {testSmsModal.result.provider}
                </div>
              )}
              {testSmsModal.result.messageId && (
                <div>
                  <strong>Message ID / Reference:</strong> {testSmsModal.result.messageId}
                </div>
              )}
              {testSmsModal.result.error && (
                <div>
                  <strong>Error:</strong> {testSmsModal.result.error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSendTestSms}
            disabled={testSmsModal.sending}
            className={`px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-sm transition ${
              testSmsModal.sending ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {testSmsModal.sending ? 'Sending...' : 'Send Live SMS'}
          </button>
        </div>
      </div>
    </div>
  );
}
