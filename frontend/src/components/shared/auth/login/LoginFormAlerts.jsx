import React from 'react';
import { setCustomServerUrl, CLOUD_SERVER_URL } from '../../../../services/api';

export default function LoginFormAlerts({ errorMsg, successMsg, isCloud }) {
  return (
    <>
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
          {errorMsg.includes('Unable to connect') && !isCloud && (
            <button
              type="button"
              onClick={() => setCustomServerUrl(CLOUD_SERVER_URL)}
              className="w-full mt-2.5 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>🌐 Switch to Live Cloud Server</span>
            </button>
          )}
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>{successMsg}</span>
        </div>
      )}
    </>
  );
}
