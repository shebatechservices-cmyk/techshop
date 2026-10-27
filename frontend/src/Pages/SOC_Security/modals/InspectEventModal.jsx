import React from "react";

function formatJson(val) {
  if (!val) return null;
  if (typeof val === 'object') return JSON.stringify(val, null, 2);
  try {
    const parsed = JSON.parse(val);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return String(val);
  }
}

export default function InspectEventModal({
  inspectEvent,
  onClose,
}) {
  if (!inspectEvent) return null;

  const oldDataStr = formatJson(inspectEvent.old_data);
  const newDataStr = formatJson(inspectEvent.new_data);
  const targetDesc = inspectEvent.table_name || inspectEvent.target_table;

  return (
    <div
      className="fixed inset-0 bg-slate-900/65 backdrop-blur-[3px] flex items-center justify-center z-[99999] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
          <div className="font-extrabold text-base sm:text-lg text-slate-900">
            SIEM Event Detail Inspector
          </div>
          <button
            type="button"
            onClick={onClose}
            className="bg-transparent border-0 text-slate-400 hover:text-slate-600 cursor-pointer p-1 text-base"
          >
            ✕
          </button>
        </div>

        <div className="bg-slate-50 p-3.5 sm:p-4 rounded-lg border border-slate-200 text-xs sm:text-sm mb-4 space-y-1.5">
          <div>
            <span className="text-slate-500">Action:</span> <strong className="text-slate-900">{inspectEvent.action}</strong>
          </div>
          <div>
            <span className="text-slate-500">Severity:</span> <strong className="text-slate-900">{inspectEvent.severity || "INFO"}</strong>
          </div>
          <div>
            <span className="text-slate-500">User / Actor:</span> <strong className="text-slate-900">{inspectEvent.user_name || (inspectEvent.user_id ? `User #${inspectEvent.user_id}` : "Automated Shield")}</strong>
          </div>
          <div>
            <span className="text-slate-500">IP Address:</span> <strong className="font-mono text-slate-900">{inspectEvent.ip_address || "127.0.0.1"}</strong>
          </div>
          <div>
            <span className="text-slate-500">Device ID:</span> <strong className="text-slate-900">{inspectEvent.device_id || "N/A"}</strong>
          </div>
          {targetDesc && (
            <div>
              <span className="text-slate-500">Target Entity:</span> <strong className="text-slate-900">{targetDesc}{inspectEvent.record_id ? ` #${inspectEvent.record_id}` : ''}</strong>
            </div>
          )}
          <div>
            <span className="text-slate-500">Timestamp:</span> <strong className="text-slate-900">{new Date(inspectEvent.created_at).toLocaleString("en-GB")}</strong>
          </div>

          {inspectEvent.details && (
            <div className="pt-2 border-t border-slate-200 mt-2">
              <span className="text-slate-500 block mb-1">Details:</span>
              <p className="m-0 text-slate-700 bg-white p-2 rounded border border-slate-200 font-mono text-xs leading-relaxed">
                {inspectEvent.details}
              </p>
            </div>
          )}

          {newDataStr && (
            <div className="pt-2 border-t border-slate-200 mt-2">
              <span className="text-slate-500 block mb-1">New / Current Data:</span>
              <pre className="m-0 text-slate-700 bg-white p-2 rounded border border-slate-200 font-mono text-xs leading-relaxed overflow-x-auto">
                {newDataStr}
              </pre>
            </div>
          )}

          {oldDataStr && (
            <div className="pt-2 border-t border-slate-200 mt-2">
              <span className="text-slate-500 block mb-1">Previous Data:</span>
              <pre className="m-0 text-slate-700 bg-white p-2 rounded border border-slate-200 font-mono text-xs leading-relaxed overflow-x-auto">
                {oldDataStr}
              </pre>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-bold text-xs sm:text-sm cursor-pointer transition-colors border-0"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
