import React, { useState } from 'react';
import { getCurrentServerUrl, setCustomServerUrl, CLOUD_SERVER_URL } from '../../../services/api';
import LoginPasswordField from './login/LoginPasswordField';
import ServerConfigModal from './login/ServerConfigModal';

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
}) {
  const [showServerModal, setShowServerModal] = useState(false);
  const currentServer = getCurrentServerUrl();

  const isCloud = currentServer.includes('shebatechnologybd.com');
  const isLocal = currentServer.includes('192.168.1.23') || currentServer.includes('localhost');

  return (
    <form onSubmit={(e) => { e.preventDefault(); executeLogin(); }}>
      {/* Phone Number or Email Field */}
      <div className="mb-4">
        <label htmlFor="login-username" className="block text-xs font-bold text-slate-700 mb-1.5">
          Phone Number or Email (User ID)
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </span>
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
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 rounded-xl text-sm text-slate-800 placeholder-slate-400 transition-all outline-none font-medium"
          />
        </div>
      </div>

      {/* Password Field */}
      <LoginPasswordField
        password={password}
        setPassword={setPassword}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        strengthScore={strengthScore}
        onForgotPassword={() => {
          setMode('forgot_password');
          setErrorMsg('');
          setSuccessMsg('');
        }}
      />

      <div className="flex items-center mb-5">
        <input
          type="checkbox"
          id="remember-me"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
        />
        <label htmlFor="remember-me" className="ml-2.5 text-xs font-medium text-slate-600 cursor-pointer select-none">
          Remember me on this browser
        </label>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium mb-4">
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
              className="w-full mt-2.5 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>🌐 Switch to Live Cloud Server (sdb.shebatechnologybd.com)</span>
            </button>
          )}
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>{successMsg}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
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
          <span>Sign In</span>
        )}
      </button>

      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col items-center gap-2.5 text-center">
        <div className="flex items-center text-xs text-slate-400 gap-1.5 font-medium">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>Authorized access only • Managed by system administrator</span>
        </div>

        {/* Server Endpoint Status & Switcher */}
        <button
          type="button"
          onClick={() => setShowServerModal(true)}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-800 bg-slate-100/90 hover:bg-slate-200/90 px-3 py-1 rounded-full border border-slate-200 transition-colors cursor-pointer"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Server: {isCloud ? 'Live Cloud (Online)' : isLocal ? 'Local LAN (Shop)' : 'Custom URL'}</span>
          <span className="text-[10px]">⚙️</span>
        </button>
      </div>

      <ServerConfigModal
        isOpen={showServerModal}
        onClose={() => setShowServerModal(false)}
        currentServer={currentServer}
        isCloud={isCloud}
        isLocal={isLocal}
      />
    </form>
  );
}
