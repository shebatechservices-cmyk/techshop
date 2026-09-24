import React from "react";

export default function FirewallTab({
  ipRules = [],
  handleDeleteIpRule,
}) {
  return (
    <div>
      {/* Firewall Shield Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* Whitelist Panel */}
        <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-extrabold text-emerald-700 uppercase tracking-wider">
              ✓ Whitelisted Static IP Range
            </span>
            <span className="text-xs text-slate-500 font-semibold">Office / Static Only</span>
          </div>
          <p className="text-xs text-slate-500 mt-0 mb-3.5">
            Logins from these IPs bypass secondary challenge checks for rapid branch access.
          </p>

          {ipRules.filter((r) => r.rule_type === "whitelist").map((r) => (
            <div
              key={r.id}
              className="flex justify-between items-center p-2 sm:px-3 bg-emerald-50 border border-emerald-200 rounded-md mb-2 text-xs sm:text-sm"
            >
              <div>
                <strong className="font-mono text-emerald-700">{r.ip_address}</strong>
                <div className="text-xs text-slate-600">{r.reason}</div>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteIpRule(r.id)}
                className="bg-transparent border-0 text-rose-500 hover:text-rose-700 cursor-pointer text-xs p-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Blacklist Panel */}
        <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-extrabold text-rose-700 uppercase tracking-wider">
              🚫 Blacklisted &amp; Spam IPs
            </span>
            <span className="text-xs text-rose-700 font-bold">Auto-Blocked</span>
          </div>
          <p className="text-xs text-slate-500 mt-0 mb-3.5">
            All inbound login attempts from these addresses are terminated instantly at the network layer.
          </p>

          {ipRules.filter((r) => r.rule_type === "block").map((r) => (
            <div
              key={r.id}
              className="flex justify-between items-center p-2 sm:px-3 bg-rose-50 border border-rose-200 rounded-md mb-2 text-xs sm:text-sm"
            >
              <div>
                <strong className="font-mono text-rose-700">{r.ip_address}</strong>
                <div className="text-xs text-slate-600">
                  {r.reason} · <strong>{r.blocked_attempts || 0} attempts blocked</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteIpRule(r.id)}
                className="bg-transparent border-0 text-rose-500 hover:text-rose-700 cursor-pointer text-xs p-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
