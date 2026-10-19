import React, { useState } from 'react';
import {
  setCustomServerUrl,
  CLOUD_SERVER_URL,
  LOCAL_LAN_SERVER_URL,
} from '../../../../services/api';

export default function ServerConfigModal({
  isOpen,
  onClose,
  currentServer,
  isCloud,
  isLocal,
}) {
  const [customInputUrl, setCustomInputUrl] = useState(currentServer || CLOUD_SERVER_URL);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100000] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5 border border-slate-200">
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span>⚙️</span> Server Endpoint Settings
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Select or enter your server API endpoint. Use <strong>Live Cloud</strong> to access from any network/mobile data, or <strong>Local LAN</strong> for in-shop Wi-Fi.
        </p>

        <div className="space-y-2 mb-4">
          <button
            type="button"
            onClick={() => setCustomServerUrl(CLOUD_SERVER_URL)}
            className={`w-full text-left p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
              isCloud
                ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-400'
                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
            }`}
          >
            <div>
              <div className="font-bold flex items-center gap-1.5">
                <span>🌐 Live Cloud Server</span>
                {isCloud && (
                  <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                    Active
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                https://sdb.shebatechnologybd.com/api (Any network)
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setCustomServerUrl(LOCAL_LAN_SERVER_URL)}
            className={`w-full text-left p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
              isLocal
                ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-400'
                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
            }`}
          >
            <div>
              <div className="font-bold flex items-center gap-1.5">
                <span>🏠 Local LAN (Shop Wi-Fi)</span>
                {isLocal && (
                  <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                    Active
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                http://192.168.1.23:3000/api (Same Wi-Fi only)
              </div>
            </div>
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            Custom API URL
          </label>
          <input
            type="text"
            value={customInputUrl}
            onChange={(e) => setCustomInputUrl(e.target.value)}
            placeholder="https://your-domain.com/api"
            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCustomServerUrl(customInputUrl)}
            className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Save & Connect
          </button>
          <button
            type="button"
            onClick={() => setCustomServerUrl(null)}
            className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            title="Reset to default"
          >
            Reset Default
          </button>
        </div>
      </div>
    </div>
  );
}
