import React, { useState } from 'react';
import { getCurrentServerUrl } from '../../../services/api';
import LoginPasswordField from './login/LoginPasswordField';
import LoginFormAlerts from './login/LoginFormAlerts';
import ServerConfigModal from './login/ServerConfigModal';

export default function LoginForm({
  identifier,
  setIdentifier,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  loading,
  errorMsg,
  setErrorMsg,
  successMsg,
  setSuccessMsg,
  executeLogin,
  setMode,
}) {
  const [showServerModal, setShowServerModal] = useState(false);
  const currentServer = getCurrentServerUrl();
  const isCloud = currentServer.includes('shebatechnologybd.com');
  const isLocal = currentServer.includes('192.168.1.23') || currentServer.includes('localhost');

  const handleClear = () => {
    setIdentifier('');
    setPassword('');
    if (typeof setErrorMsg === 'function') setErrorMsg('');
    if (typeof setSuccessMsg === 'function') setSuccessMsg('');
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); executeLogin(); }}>
      {/* User Field */}
      <div className="mb-4">
        <label htmlFor="login-username" className="block text-xs font-semibold text-slate-700 mb-1.5">
          User:
        </label>
        <input
          type="text"
          id="login-username"
          name="username"
          autoComplete="username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="Email or Phone number"
          autoFocus
          required
          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 rounded-lg text-sm text-slate-800 placeholder-slate-400 transition-all outline-none"
        />
      </div>

      {/* Password Field */}
      <LoginPasswordField
        password={password}
        setPassword={setPassword}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
      />

      {/* Alerts */}
      <LoginFormAlerts
        errorMsg={errorMsg}
        successMsg={successMsg}
        isCloud={isCloud}
      />

      {/* Action Buttons: Login & Clear */}
      <div className="flex items-center gap-3 mt-5">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Logging In...</span>
            </>
          ) : (
            <span>Login</span>
          )}
        </button>

        <button
          type="button"
          onClick={handleClear}
          disabled={loading}
          className="px-5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold text-sm transition-colors cursor-pointer border border-slate-200"
        >
          Clear
        </button>
      </div>

      {/* Recovery */}
      <div className="mt-5 text-center text-xs text-slate-500">
        Forgot ID or Password?{' '}
        <button
          type="button"
          onClick={() => {
            if (typeof setMode === 'function') setMode('forgot_password');
            if (typeof setErrorMsg === 'function') setErrorMsg('');
            if (typeof setSuccessMsg === 'function') setSuccessMsg('');
          }}
          className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline transition-colors cursor-pointer ml-0.5"
        >
          [Recovery]
        </button>
      </div>

      {/* Minimal Footer with Server Indicator */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <button
          type="button"
          onClick={() => setShowServerModal(true)}
          className="inline-flex items-center gap-1.5 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>{isCloud ? 'Cloud' : isLocal ? 'Local LAN' : 'Custom Server'}</span>
          <span className="text-[10px]">⚙️</span>
        </button>
        <span>Sheba Tech</span>
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
