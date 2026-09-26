import React from 'react';

export default function ForgotPasswordForm({
  recoveryId,
  setRecoveryId,
  recoveryRole,
  setRecoveryRole,
  recoveryLoading,
  recoverySuccess,
  recoveryError,
  handleRecovery,
  setMode,
}) {
  return (
    <form onSubmit={handleRecovery}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-800">
          Password Recovery
        </h3>
        <button
          type="button"
          onClick={() => setMode('login')}
          className="text-xs text-gray-500 hover:text-gray-800 font-medium inline-flex items-center gap-1 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Login</span>
        </button>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed mb-3.5">
        Enter your registered phone number or email address. The shop administrator or developer panel will assist in resetting your password.
      </p>

      <div className="mb-3.5">
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          User Category
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRecoveryRole('staff')}
            className={`flex-1 py-2 px-3 rounded-md border text-xs font-semibold transition-all ${
              recoveryRole === 'staff'
                ? 'border-green-600 bg-green-50 text-green-700'
                : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Staff / Technician
          </button>
          <button
            type="button"
            onClick={() => setRecoveryRole('admin')}
            className={`flex-1 py-2 px-3 rounded-md border text-xs font-semibold transition-all ${
              recoveryRole === 'admin'
                ? 'border-sky-600 bg-sky-50 text-sky-700'
                : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Shop Admin
          </button>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          Registered Phone or Email *
        </label>
        <div className="flex items-center border rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-green-500">
          <div className="px-3 py-2 bg-gray-50 border-r flex items-center justify-center text-gray-500">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <input
            type="text"
            value={recoveryId}
            onChange={(e) => setRecoveryId(e.target.value)}
            placeholder="017xxxxxxxx or your@email.com"
            required
            className="w-full px-3 py-2 outline-none border-none text-sm text-gray-800 placeholder-gray-400"
          />
        </div>
      </div>

      {recoveryError && (
        <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium mb-3.5 flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{recoveryError}</span>
        </div>
      )}

      {recoverySuccess && (
        <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium mb-3.5 flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>{recoverySuccess}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={recoveryLoading}
        className="w-full py-2.5 px-4 rounded-md bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold text-sm shadow-sm hover:shadow transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {recoveryLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Sending Request...</span>
          </>
        ) : (
          'Send Recovery Request'
        )}
      </button>
    </form>
  );
}


