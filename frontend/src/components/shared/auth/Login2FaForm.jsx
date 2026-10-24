import React from 'react';

export default function Login2FaForm({
  maskedEmail,
  otpCode,
  setOtpCode,
  verifyingOtp,
  verifyError,
  approvalNotice,
  onVerify,
  onCancel,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onVerify) onVerify(otpCode);
  };

  return (
    <div className="w-full max-w-md mx-auto p-2 sm:p-4">
      {/* Security Icon & Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-xl font-black text-slate-900 tracking-tight m-0">
          New Device Verification
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Unrecognized hardware detected. Complete Two-Step Verification to access Sheba ERP.
        </p>
      </div>

      {/* Real-time Dual Verification Guidance Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-5 text-xs text-slate-600 space-y-2">
        <div className="flex items-start gap-2">
          <span className="font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">
            Option 1
          </span>
          <span>
            Check your email (<strong>{maskedEmail}</strong>) for a 6-digit verification code.
          </span>
        </div>
        <div className="flex items-start gap-2 border-t border-slate-200/80 pt-2">
          <span className="font-bold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded text-[10px]">
            Option 2
          </span>
          <span>
            Or ask your <strong>Shop Admin</strong> to click <em>Approve Now</em> in <strong>SOC Security ➔ Devices</strong>.
          </span>
        </div>
      </div>

      {/* Feedback Alerts */}
      {verifyError && (
        <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold mb-4 flex items-center gap-2">
          <span>⚠️</span> <span>{verifyError}</span>
        </div>
      )}
      {approvalNotice && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold mb-4 flex items-center gap-2 animate-pulse">
          <span>✓</span> <span>{approvalNotice}</span>
        </div>
      )}

      {/* Code Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 text-center">
            Enter 6-Digit Code
          </label>
          <input
            type="text"
            maxLength={6}
            autoFocus
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="······"
            className="w-full text-center text-3xl font-mono font-black tracking-[12px] py-3.5 px-4 rounded-xl border border-slate-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white shadow-inner text-slate-900"
          />
        </div>

        <button
          type="submit"
          disabled={verifyingOtp || otpCode.length < 6}
          className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-white shadow-lg transition-all cursor-pointer border-0 ${
            verifyingOtp || otpCode.length < 6
              ? 'bg-slate-300 cursor-not-allowed shadow-none'
              : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30 hover:shadow-emerald-600/50'
          }`}
        >
          {verifyingOtp ? 'Verifying Code...' : 'Verify & Authorize Device'}
        </button>

        {/* Polling Heartbeat Badge */}
        <div className="text-center pt-1">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Listening for Admin remote approval...</span>
          </span>
        </div>

        {/* Cancel / Switch Account */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors bg-transparent border-0 cursor-pointer"
          >
            ← Back to Login with Another Account
          </button>
        </div>
      </form>
    </div>
  );
}
