import React, { useState } from 'react';

export default function Login2FaForm({
  otpCode,
  setOtpCode,
  verifyingOtp,
  verifyError,
  approvalNotice,
  onVerify,
  onCancel,
}) {
  const [showManualCode, setShowManualCode] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onVerify) onVerify(otpCode);
  };

  return (
    <div className="w-full max-w-md mx-auto p-2 sm:p-4 text-center">
      {/* Security Icon & Header */}
      <div className="mb-6">
        <div className="relative w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white" />
          </span>
        </div>
        <h3 className="text-xl font-black text-slate-900 tracking-tight m-0">
          নতুন ডিভাইস অনুমোদন প্রয়োজন
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Unrecognized Device Detected. Waiting for Shop Admin remote authorization.
        </p>
      </div>

      {/* Admin Approval Radar Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-5 shadow-xs">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <span className="text-xs font-bold text-slate-700">
            অ্যাডমিন অনুমোদনের অপেক্ষা করা হচ্ছে...
          </span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed m-0">
          দোকানের অ্যাডমিন (Shop Admin) তার ড্যাশবোর্ডের <strong className="text-slate-800">SOC Security ➔ Devices</strong> থেকে <span className="text-emerald-700 font-bold">Approve Now</span> দিলেই আপনার সফটওয়্যারটি স্বয়ংক্রিয়ভাবে চালু হয়ে যাবে।
        </p>
      </div>

      {/* Feedback Alerts */}
      {verifyError && (
        <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold mb-4 flex items-center justify-center gap-2">
          <span>⚠️</span> <span>{verifyError}</span>
        </div>
      )}
      {approvalNotice && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold mb-4 flex items-center justify-center gap-2 animate-pulse">
          <span>✓</span> <span>{approvalNotice}</span>
        </div>
      )}

      {/* Optional Manual Code Input Toggle */}
      {showManualCode ? (
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
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
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
            }`}
          >
            {verifyingOtp ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>
      ) : (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowManualCode(true)}
            className="text-[11px] text-slate-400 hover:text-slate-600 underline bg-transparent border-0 cursor-pointer"
          >
            ভেরিফিকেশন কোড আছে? এখানে ক্লিক করুন
          </button>
        </div>
      )}

      {/* Back to Login with Another Account */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors bg-transparent border-0 cursor-pointer"
        >
          ← অন্য অ্যাকাউন্ট দিয়ে লগইন করুন (Back to Login)
        </button>
      </div>
    </div>
  );
}
