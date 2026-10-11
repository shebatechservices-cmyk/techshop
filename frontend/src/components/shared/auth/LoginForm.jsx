import React, { useState } from 'react';
import { getCurrentServerUrl, setCustomServerUrl, CLOUD_SERVER_URL, LOCAL_LAN_SERVER_URL } from '../../../services/api';

export default function LoginForm({
  identifier,
  setIdentifier,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  rememberMe,
  setRememberMe,
  loading,
  errorMsg,
  setErrorMsg,
  successMsg,
  setSuccessMsg,
  strengthScore,
  executeLogin,
  setMode,
  onOpenDevConsole,
}) {
  const [showServerModal, setShowServerModal] = useState(false);
  const currentServer = getCurrentServerUrl();
  const [customInputUrl, setCustomInputUrl] = useState(currentServer || CLOUD_SERVER_URL);

  const isCloud = currentServer.includes('shebatechnologybd.com');
  const isLocal = currentServer.includes('192.168.1.23') || currentServer.includes('localhost');
  return (
    <form onSubmit={(e) => { e.preventDefault(); executeLogin(); }}>

      {/* Phone Number or Email Field */}
      <div className="mb-4">
        <label htmlFor="login-username" className="block text-xs font-semibold text-gray-700 mb-1.5">
          Phone Number or Email (User ID)
        </label>
        <div className="flex items-center border rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-green-500">
          <div className="px-3 py-2 bg-gray-50 border-r flex items-center justify-center text-gray-500">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <input
            type="text"
            id="login-username"
            name="username"
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="017xxxxxxxx or user@shebatech.com"
            autoFocus
            required
            className="w-full px-3 py-2 outline-none border-none text-sm text-gray-800 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="mb-3.5">
        <div className="flex justify-between items-center mb-1.5">
          <label htmlFor="login-password" className="text-xs font-semibold text-gray-700">
            Password
          </label>
          <button
            type="button"
            onClick={() => { setMode('forgot_password'); setErrorMsg(''); setSuccessMsg(''); }}
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline"
          >
            Forgot Password?
          </button>
        </div>
        <div className="flex items-center border rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-green-500">
          <div className="px-3 py-2 bg-gray-50 border-r flex items-center justify-center text-gray-500">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            id="login-password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full px-3 py-2 outline-none border-none text-sm text-gray-800 placeholder-gray-400"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="px-3 py-2 text-gray-400 hover:text-gray-600 focus:outline-none flex items-center justify-center"
            title={showPassword ? "Hide password" : "Show password"}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>

        {/* Password Strength Indicator */}
        {password.length > 0 && (
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex gap-1 flex-1">
              <div className={`h-1 flex-1 rounded-full ${strengthScore >= 1 ? 'bg-rose-500' : 'bg-gray-200'}`} />
              <div className={`h-1 flex-1 rounded-full ${strengthScore >= 2 ? 'bg-amber-500' : 'bg-gray-200'}`} />
              <div className={`h-1 flex-1 rounded-full ${strengthScore >= 3 ? 'bg-emerald-500' : 'bg-gray-200'}`} />
              <div className={`h-1 flex-1 rounded-full ${strengthScore >= 4 ? 'bg-emerald-600' : 'bg-gray-200'}`} />
            </div>
            <span className={`text-[11px] font-semibold ${strengthScore >= 3 ? 'text-emerald-600' : 'text-gray-500'}`}>
              {strengthScore >= 3 ? '✓ Strong' : 'Standard'}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center mb-5">
        <input
          type="checkbox"
          id="remember-me"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer accent-green-600"
        />
        <label htmlFor="remember-me" className="ml-2 text-xs text-gray-600 cursor-pointer select-none">
          Remember me on this browser
        </label>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium mb-4">
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
              className="w-full mt-2 py-1.5 px-3 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>🌐 Switch to Live Cloud Server (sdb.shebatechnologybd.com)</span>
            </button>
          )}
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>{successMsg}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 px-4 rounded-md bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold text-sm shadow-sm hover:shadow transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Signing In...</span>
          </>
        ) : (
          'Sign In'
        )}
      </button>

      <div className="mt-4 pt-3.5 border-t border-gray-100 flex justify-center items-center text-center text-xs text-gray-500 gap-1.5">
        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>Authorized access only • Managed by system administrator</span>
      </div>

      {/* Server Endpoint Status & Switcher */}
      <div className="mt-3 flex items-center justify-center">
        <button
          type="button"
          onClick={() => setShowServerModal(true)}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full border border-slate-200 transition-colors cursor-pointer"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Server: {isCloud ? 'Live Cloud (Online)' : isLocal ? 'Local LAN (Shop)' : 'Custom URL'}</span>
          <span className="text-[10px]">⚙️</span>
        </button>
      </div>

      {/* Server Config Modal */}
      {showServerModal && (
        <div className="fixed inset-0 z-[100000] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5 border border-slate-200">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span>⚙️</span> Server Endpoint Settings
              </h3>
              <button
                type="button"
                onClick={() => setShowServerModal(false)}
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
                onClick={() => { setCustomServerUrl(CLOUD_SERVER_URL); }}
                className={`w-full text-left p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                  isCloud
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-400'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <span>🌐 Live Cloud Server</span>
                    {isCloud && <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.2 rounded font-bold">Active</span>}
                  </div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">https://sdb.shebatechnologybd.com/api (Any network)</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setCustomServerUrl(LOCAL_LAN_SERVER_URL); }}
                className={`w-full text-left p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                  isLocal
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-400'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <span>🏠 Local LAN (Shop Wi-Fi)</span>
                    {isLocal && <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.2 rounded font-bold">Active</span>}
                  </div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">http://192.168.1.23:3000/api (Same Wi-Fi only)</div>
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
                onClick={() => { setCustomServerUrl(customInputUrl); }}
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Save & Connect
              </button>
              <button
                type="button"
                onClick={() => { setCustomServerUrl(null); }}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                title="Reset to default"
              >
                Reset Default
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}


