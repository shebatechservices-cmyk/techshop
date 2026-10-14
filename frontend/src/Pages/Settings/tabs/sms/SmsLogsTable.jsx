import React from 'react';

export default function SmsLogsTable({ smsLogs = [] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
        📜 Recent Automated SMS Dispatch Logs
      </h4>
      <div className="overflow-x-auto border border-slate-200 rounded-md">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
            <tr>
              <th className="px-3 py-2">Timestamp</th>
              <th className="px-3 py-2">Trigger Event</th>
              <th className="px-3 py-2">Recipient Phone</th>
              <th className="px-3 py-2">Message Content</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {smsLogs.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-3 py-4 text-center text-slate-400">
                  No SMS logs found. Dispatches will appear here in real-time.
                </td>
              </tr>
            ) : (
              smsLogs.map((log, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="px-3 py-2 text-slate-500 whitespace-nowrap">
                    {log.created_at ? new Date(log.created_at).toLocaleString() : 'Just now'}
                  </td>
                  <td className="px-3 py-2 font-semibold text-slate-800">
                    {log.trigger_name || log.trigger_key}
                  </td>
                  <td className="px-3 py-2 font-mono text-slate-700">{log.phone}</td>
                  <td className="px-3 py-2 text-slate-600 max-w-xs truncate">{log.message}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.status === 'DELIVERED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {log.status === 'DELIVERED' ? '✓ DELIVERED' : log.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
