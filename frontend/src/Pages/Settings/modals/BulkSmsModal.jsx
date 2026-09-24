import React from 'react';

export default function BulkSmsModal({
  bulkSmsModal,
  setBulkSmsModal,
  handleSendBulkSms,
  settings = {},
}) {
  if (!bulkSmsModal?.open) return null;

  const handleClose = () => {
    setBulkSmsModal({
      open: false,
      targetGroup: 'due_customers',
      customNumbers: '',
      message: '',
      sending: false,
      result: null,
    });
  };

  const msgLength = bulkSmsModal.message ? bulkSmsModal.message.length : 0;
  const smsParts = Math.ceil(msgLength / 160) || 1;
  const isSendDisabled = bulkSmsModal.sending || !bulkSmsModal.message.trim();

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
              <span>📢</span> Bulk SMS Broadcast
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Send promotional or emergency alerts to customers or field staff
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
              Target Audience
            </label>
            <select
              value={bulkSmsModal.targetGroup}
              onChange={(e) => setBulkSmsModal({ ...bulkSmsModal, targetGroup: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
            >
              <option value="due_customers">⚠️ All Due Customers (Outstanding Balance)</option>
              <option value="technicians">🛠️ All Field Technicians</option>
              <option value="all_customers">👥 All Registered Clients</option>
              <option value="custom">✍️ Custom Phone Numbers List</option>
            </select>
          </div>

          {bulkSmsModal.targetGroup === 'custom' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Mobile Numbers (Comma or Newline separated)
              </label>
              <textarea
                rows={2}
                value={bulkSmsModal.customNumbers}
                onChange={(e) => setBulkSmsModal({ ...bulkSmsModal, customNumbers: e.target.value })}
                placeholder="01711223344, 01822334455..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition resize-y"
              />
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Broadcast Message Text
              </label>
              <span className="text-[10px] text-slate-500">
                {msgLength} chars ({smsParts} SMS)
              </span>
            </div>
            <textarea
              rows={3}
              value={bulkSmsModal.message}
              onChange={(e) => setBulkSmsModal({ ...bulkSmsModal, message: e.target.value })}
              placeholder={`[${settings.shop_name || 'Sheba Tech'}] Dear customer, thank you for being with us...`}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition resize-y"
            />
          </div>

          {bulkSmsModal.result && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium">
              ✓ {bulkSmsModal.result.message}
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
            onClick={handleSendBulkSms}
            disabled={isSendDisabled}
            className={`px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-sm transition ${
              isSendDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {bulkSmsModal.sending ? 'Broadcasting...' : '📢 Send Broadcast'}
          </button>
        </div>
      </div>
    </div>
  );
}
