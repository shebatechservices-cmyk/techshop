import React from 'react';

export default function LoginPasswordField({
  password,
  setPassword,
  showPassword,
  setShowPassword,
  strengthScore,
  onForgotPassword,
}) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1.5">
        <label htmlFor="login-password" className="text-xs font-bold text-slate-700">
          Password
        </label>
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors cursor-pointer"
        >
          Forgot Password?
        </button>
      </div>
      <div className="relative flex items-center">
        <span className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
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
          className="w-full pl-10 pr-11 py-2.5 bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 rounded-xl text-sm text-slate-800 placeholder-slate-400 transition-all outline-none font-medium tracking-wide"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-2 px-2.5 py-1.5 text-slate-400 hover:text-slate-600 focus:outline-none rounded-lg transition-colors cursor-pointer"
          title={showPassword ? 'Hide password' : 'Show password'}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>

      {password.length > 0 && (
        <div className="flex items-center gap-2 mt-2 px-0.5">
          <div className="flex gap-1 flex-1">
            <div className={`h-1 flex-1 rounded-full transition-all ${strengthScore >= 1 ? 'bg-rose-500' : 'bg-slate-200'}`} />
            <div className={`h-1 flex-1 rounded-full transition-all ${strengthScore >= 2 ? 'bg-amber-500' : 'bg-slate-200'}`} />
            <div className={`h-1 flex-1 rounded-full transition-all ${strengthScore >= 3 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
            <div className={`h-1 flex-1 rounded-full transition-all ${strengthScore >= 4 ? 'bg-emerald-600' : 'bg-slate-200'}`} />
          </div>
          <span className={`text-[11px] font-semibold ${strengthScore >= 3 ? 'text-emerald-600' : 'text-slate-500'}`}>
            {strengthScore >= 3 ? '✓ Strong' : 'Standard'}
          </span>
        </div>
      )}
    </div>
  );
}
