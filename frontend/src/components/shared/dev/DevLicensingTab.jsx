import React from 'react';

export default function DevLicensingTab({
  systemInfo,
  devicesData,
  fetchDevInfo,
  handleKickDevice,
}) {
  return (
    <div className="flex flex-col gap-4 text-xs font-mono">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4 shadow-sm">
          <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2.5 m-0">
            Domain & SSL Licensing
          </h4>
          <div className="space-y-1 text-slate-400">
            <div>Domain: <strong className="text-slate-100">{systemInfo?.licensing?.domain_name || 'shebatech.com.bd'}</strong></div>
            <div>SSL Certificate: <strong className="text-emerald-400">{systemInfo?.licensing?.ssl_status || 'TLS 1.3 Active'}</strong></div>
            <div>License Status: <strong className="text-amber-400">{systemInfo?.licensing?.license_status || 'Enterprise Activated'}</strong></div>
            <div>Key: <code className="text-sky-400">{systemInfo?.licensing?.license_key || 'SHEBA-COMMERCIAL-UNLOCKED'}</code></div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4 shadow-sm">
          <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2.5 m-0">
            Device Slots Allocation
          </h4>
          <div className="space-y-1 text-slate-400">
            <div>
              💻 Desktops / Laptops:{' '}
              <strong className={devicesData.counts?.desktop >= 3 ? 'text-rose-400' : 'text-emerald-400'}>
                {devicesData.counts?.desktop || 0} / 3 Slots Used
              </strong>
            </div>
            <div>
              📱 Mobile Phones:{' '}
              <strong className={devicesData.counts?.mobile >= 3 ? 'text-rose-400' : 'text-emerald-400'}>
                {devicesData.counts?.mobile || 0} / 3 Slots Used
              </strong>
            </div>
            <div className="text-[11px] text-slate-500 mt-2">
              Logged-in devices can be remotely terminated below to release slots for new devices.
            </div>
          </div>
        </div>
      </div>

      {/* Active Desktops List */}
      <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider m-0">
            💻 Active Desktops / Laptops ({devicesData.desktops?.length || 0} / 3)
          </h4>
          <button
            type="button"
            onClick={fetchDevInfo}
            className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg border border-slate-700 font-bold text-[11px] transition-colors"
          >
            Refresh
          </button>
        </div>

        {devicesData.desktops?.length === 0 ? (
          <p className="text-slate-500 text-xs text-center py-3 m-0">No active desktop sessions registered yet.</p>
        ) : (
          <div className="space-y-2">
            {devicesData.desktops?.map((d) => (
              <div key={d.device_id} className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex justify-between items-center flex-wrap gap-2">
                <div>
                  <div className="font-bold text-slate-200">💻 {d.device_name}</div>
                  <div className="text-slate-500 text-[11px]">
                    ID: {d.device_id.substring(0, 16)}... • IP: {d.ip_address} • Active: {new Date(d.last_active).toLocaleString()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleKickDevice(d.device_id, d.device_name)}
                  className="py-1 px-2.5 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 font-bold text-[11px] transition-colors"
                >
                  Kick / Free Slot
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Mobiles List */}
      <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4 shadow-sm">
        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 m-0">
          📱 Active Mobile Phones ({devicesData.mobiles?.length || 0} / 3)
        </h4>

        {devicesData.mobiles?.length === 0 ? (
          <p className="text-slate-500 text-xs text-center py-3 m-0">No active mobile sessions registered yet.</p>
        ) : (
          <div className="space-y-2">
            {devicesData.mobiles?.map((d) => (
              <div key={d.device_id} className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex justify-between items-center flex-wrap gap-2">
                <div>
                  <div className="font-bold text-slate-200">📱 {d.device_name}</div>
                  <div className="text-slate-500 text-[11px]">
                    ID: {d.device_id.substring(0, 16)}... • IP: {d.ip_address} • Active: {new Date(d.last_active).toLocaleString()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleKickDevice(d.device_id, d.device_name)}
                  className="py-1 px-2.5 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 font-bold text-[11px] transition-colors"
                >
                  Kick / Free Slot
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
