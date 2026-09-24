import React from "react";
import { SEVERITY_CONFIG } from "../utils/securityConstants";

export { SEVERITY_CONFIG };

export default function AuditTrailTab({
  logs = [],
  filteredLogs = [],
  severityFilter = "ALL",
  setSeverityFilter,
  auditSearch = "",
  setAuditSearch,
  setInspectEvent,
}) {
  return (
    <div>
      {/* Severity Pills & Search Bar */}
      <div className="flex justify-between items-center gap-3 mb-4 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {Object.keys(SEVERITY_CONFIG).map((sev) => {
            const cfg = SEVERITY_CONFIG[sev];
            const count =
              sev === "ALL"
                ? logs.length
                : logs.filter((l) => (l.severity || "INFO").toUpperCase() === sev).length;
            const isSelected = severityFilter === sev;

            return (
              <button
                key={sev}
                type="button"
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? "border-2 border-slate-900 bg-slate-900 text-white shadow-sm"
                    : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>{cfg.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[0.7rem] ${
                  isSelected ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="min-w-[280px] flex-1 max-w-md">
          <input
            type="text"
            value={auditSearch}
            onChange={(e) => setAuditSearch(e.target.value)}
            placeholder="🔍 Search events by user, action, IP address..."
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white text-slate-900 box-border"
          />
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-slate-900 text-white text-xs font-extrabold tracking-wider">
              <th className="px-3.5 py-2.5 w-24">SEVERITY</th>
              <th className="px-3.5 py-2.5">EVENT / ACTION</th>
              <th className="px-3.5 py-2.5">USER / ACTOR</th>
              <th className="px-3.5 py-2.5">ORIGIN IP</th>
              <th className="px-3.5 py-2.5">DEVICE ID</th>
              <th className="px-3.5 py-2.5">TARGET</th>
              <th className="px-3.5 py-2.5">TIMESTAMP</th>
              <th className="px-3.5 py-2.5 text-center w-20">DETAILS</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-9 text-center text-slate-400 text-sm">
                  No audit events matching criteria.
                </td>
              </tr>
            ) : (
              filteredLogs.map((l, idx) => {
                const sev = (l.severity || "INFO").toUpperCase();
                const badgeClass =
                  sev === "CRITICAL"
                    ? "bg-rose-100 text-rose-700 border-rose-200"
                    : sev === "WARNING"
                    ? "bg-amber-100 text-amber-700 border-amber-200"
                    : sev === "BLOCKED"
                    ? "bg-purple-100 text-purple-700 border-purple-200"
                    : sev === "INFO"
                    ? "bg-sky-100 text-sky-700 border-sky-200"
                    : "bg-slate-100 text-slate-600 border-slate-200";

                return (
                  <tr key={l.id || idx} className={`border-b border-slate-100 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"} hover:bg-slate-50 transition-colors`}>
                    <td className="px-3.5 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-extrabold border ${badgeClass}`}>
                        {sev}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 font-bold text-slate-900">
                      {l.action}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <div className="font-semibold text-slate-800">
                        {l.user_name || (l.user_id ? `User #${l.user_id}` : "System Shield")}
                      </div>
                      {l.role_name && <div className="text-xs text-slate-500">{l.role_name}</div>}
                    </td>
                    <td className="px-3.5 py-2.5 font-mono text-slate-600 text-xs">
                      {l.ip_address || "127.0.0.1"}
                    </td>
                    <td className="px-3.5 py-2.5 text-xs text-slate-500">
                      {l.device_id || "-"}
                    </td>
                    <td className="px-3.5 py-2.5 text-xs text-slate-600">
                      {l.target_table || l.table_name || "-"}{l.record_id ? ` #${l.record_id}` : ""}
                    </td>
                    <td className="px-3.5 py-2.5 text-xs text-slate-500">
                      {l.created_at ? new Date(l.created_at).toLocaleString("en-GB") : "-"}
                    </td>
                    <td className="px-3.5 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => setInspectEvent(l)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-xs font-bold cursor-pointer transition-colors text-slate-700"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
