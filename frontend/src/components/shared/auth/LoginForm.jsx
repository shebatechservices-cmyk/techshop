import React from 'react';

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
  return (
    <form onSubmit={(e) => { e.preventDefault(); executeLogin(); }}>

      <div className="mb-4">
        <label htmlFor="login-username" className="block text-xs font-semibold text-slate-700 mb-1.5">
          মোবাইল নম্বর অথবা ইমেইল (User ID)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            👤
          </span>
          <input
            type="text"
            id="login-username"
            name="username"
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="017xxxxxxxx অথবা user@shebatech.com"
            autoFocus
            required
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
          />
        </div>
      </div>

      <div className="mb-3.5">
        <div className="flex justify-between items-center mb-1.5">
          <label htmlFor="login-password" className="text-xs font-semibold text-slate-700">
            পাসওয়ার্ড (Password)
          </label>
          <button
            type="button"
            onClick={() => { setMode('forgot_password'); setErrorMsg(''); setSuccessMsg(''); }}
            className="text-xs font-semibold text-sky-600 hover:underline"
          >
            পাসওয়ার্ড ভুলে গেছেন?
          </button>
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            🔒
          </span>
          <input
            type={showPassword ? 'text' : 'password'}
            id="login-password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? '👁️' : '🙈'}
          </button>
        </div>

        {/* Password Strength Indicator */}
        {password.length > 0 && (
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex gap-1 flex-1">
              <div className={`h-1 flex-1 rounded-full ${strengthScore >= 1 ? 'bg-rose-500' : 'bg-slate-200'}`} />
              <div className={`h-1 flex-1 rounded-full ${strengthScore >= 2 ? 'bg-amber-500' : 'bg-slate-200'}`} />
              <div className={`h-1 flex-1 rounded-full ${strengthScore >= 3 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
              <div className={`h-1 flex-1 rounded-full ${strengthScore >= 4 ? 'bg-emerald-600' : 'bg-slate-200'}`} />
            </div>
            <span className={`text-[11px] font-semibold ${strengthScore >= 3 ? 'text-emerald-600' : 'text-slate-500'}`}>
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
          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
        />
        <label htmlFor="remember-me" className="ml-2 text-xs text-slate-600 cursor-pointer select-none">
          এই ব্রাউজারে লগইন মনে রাখুন
        </label>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium mb-4">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium mb-4">
          {successMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
      >
        {loading ? 'লগইন হচ্ছে...' : 'লগইন করুন (Sign In)'}
      </button>

      <div className="mt-4 pt-3.5 border-t border-slate-100 flex justify-center items-center text-center text-xs text-slate-400">
        <span>🔒 নতুন একাউন্ট শুধুমাত্র শপ অ্যাডমিন কর্তৃক তৈরি করা হয়।</span>
      </div>
    </form>
  );
}
