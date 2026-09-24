import React from "react";

export default function AddIpRuleModal({
  isOpen,
  onClose,
  newIpRule,
  setNewIpRule,
  handleCreateIpRule,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/65 backdrop-blur-[3px] flex items-center justify-center z-[99999] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200">
        <h3 className="m-0 mb-4 text-lg font-black text-slate-900">
          + Add IP Firewall Rule
        </h3>
        <form onSubmit={handleCreateIpRule}>
          <div className="mb-3">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              IPv4 / IPv6 Address *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 103.145.118.42 or 45.154.255.89"
              value={newIpRule.ip_address}
              onChange={(e) => setNewIpRule({ ...newIpRule, ip_address: e.target.value })}
              className="w-full px-2.5 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white text-slate-900 box-border"
            />
          </div>

          <div className="mb-3">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Rule Policy
            </label>
            <select
              value={newIpRule.rule_type}
              onChange={(e) => setNewIpRule({ ...newIpRule, rule_type: e.target.value })}
              className="w-full px-2.5 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white text-slate-700"
            >
              <option value="block">🚫 BLOCK (Blacklist &amp; Drop Traffic)</option>
              <option value="whitelist">✓ WHITELIST (Trusted Office Broadband)</option>
            </select>
          </div>

          <div className="mb-4.5">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Reason / Threat Description
            </label>
            <input
              type="text"
              placeholder="e.g. Brute-force credential attempts from botnet"
              value={newIpRule.reason}
              onChange={(e) => setNewIpRule({ ...newIpRule, reason: e.target.value })}
              className="w-full px-2.5 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white text-slate-900 box-border"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm cursor-pointer transition-colors border-0"
            >
              Save IP Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
