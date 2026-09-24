import React from "react";

export default function DevicesTab({
  strictDeviceMode,
  setStrictDeviceMode,
  showToast,
  devices = [],
  handleToggleDeviceAuth,
  handleDeleteDevice,
}) {
  return (
    <div>
      {/* Strict Device Mode Switch */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:px-5 mb-4.5 flex justify-between items-center flex-wrap gap-3 shadow-sm">
        <div>
          <div className="font-extrabold text-sm sm:text-base text-slate-900">
            Strict Hardware Device Authorization Mode
          </div>
          <p className="mt-0.5 mb-0 text-xs text-slate-500">
            When enabled, employees and field technicians can only access the software from pre-authorized Device IDs or registered terminals.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setStrictDeviceMode(!strictDeviceMode);
            showToast(`Strict Device Mode ${!strictDeviceMode ? "ENABLED (Zero Trust)" : "DISABLED (Flexible)"}`);
          }}
          className={`px-4 py-1.5 rounded-full border-0 font-extrabold text-xs cursor-pointer transition-colors ${
            strictDeviceMode
              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
              : "bg-rose-100 text-rose-800 hover:bg-rose-200"
          }`}
        >
          {strictDeviceMode ? "✓ STRICT MODE ACTIVE" : "⚠️ PERMISSIVE MODE"}
        </button>
      </div>

      {/* Devices Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-slate-900 text-white text-xs font-extrabold tracking-wider">
              <th className="px-3.5 py-2.5">DEVICE ID</th>
              <th className="px-3.5 py-2.5">DEVICE NAME</th>
              <th className="px-3.5 py-2.5">TYPE</th>
              <th className="px-3.5 py-2.5">ENVIRONMENT / BROWSER</th>
              <th className="px-3.5 py-2.5">ASSIGNED USER</th>
              <th className="px-3.5 py-2.5 text-center">STATUS</th>
              <th className="px-3.5 py-2.5 text-center w-32">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d, idx) => (
              <tr key={d.id || idx} className={`border-b border-slate-100 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"} hover:bg-slate-50 transition-colors`}>
                <td className="px-3.5 py-3 font-mono font-bold text-sky-600 text-xs">
                  {d.device_id}
                </td>
                <td className="px-3.5 py-3 font-semibold text-slate-900">
                  {d.device_name}
                </td>
                <td className="px-3.5 py-3 uppercase text-xs text-slate-500">
                  {d.device_type}
                </td>
                <td className="px-3.5 py-3 text-xs text-slate-600">
                  {d.browser_info || "Unknown Environment"}
                </td>
                <td className="px-3.5 py-3 text-xs font-medium text-slate-800">
                  {d.user_name || "Counter Terminal"}
                </td>
                <td className="px-3.5 py-3 text-center">
                  {d.is_authorized ? (
                    <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      ✓ AUTHORIZED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                      🚫 REVOKED
                    </span>
                  )}
                </td>
                <td className="px-3.5 py-3 text-center whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleToggleDeviceAuth(d)}
                    className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer transition-colors ${
                      d.is_authorized
                        ? "border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700"
                        : "border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {d.is_authorized ? "Revoke" : "Authorize"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteDevice(d.id)}
                    className="ml-1.5 px-2 py-1 rounded border border-slate-200 bg-slate-50 hover:bg-rose-50 text-rose-600 text-xs font-bold cursor-pointer transition-colors"
                    title="Deregister Device"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
